import PayableAccount from '../models/PayableAccount.js';
import SupplierInvoice from '../models/SupplierInvoice.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todas las cuentas por pagar
export const getPayables = async (req, res) => {
  try {
    const { status, supplierId, overdue } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (overdue === 'true') {
      filter.status = { $in: ['pending', 'partial', 'overdue'] };
      filter.dueDate = { $lt: new Date() };
    }
    
    const payables = await PayableAccount.find(filter).sort({ dueDate: 1 });
    
    res.json({
      success: true,
      data: payables
    });
  } catch (error) {
    console.error('Error al obtener cuentas por pagar:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener cuentas por pagar' 
    });
  }
};

// Obtener cuenta por pagar por ID
export const getPayableById = async (req, res) => {
  try {
    const payable = await PayableAccount.findById(req.params.id);
    
    if (!payable) {
      return res.status(404).json({ 
        success: false,
        message: 'Cuenta por pagar no encontrada' 
      });
    }

    res.json({
      success: true,
      data: payable
    });
  } catch (error) {
    console.error('Error al obtener cuenta por pagar:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener cuenta por pagar' 
    });
  }
};

// Registrar pago
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const payable = await PayableAccount.findById(req.params.id);

    if (!payable) {
      return res.status(404).json({ 
        success: false,
        message: 'Cuenta por pagar no encontrada' 
      });
    }

    // Validar monto
    if (amount > payable.amountDue) {
      return res.status(400).json({
        success: false,
        message: `El monto excede lo pendiente ($${payable.amountDue.toFixed(2)})`
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a cero'
      });
    }

    // Registrar pago
    await payable.addPayment({
      amount,
      paymentMethod,
      reference,
      notes,
      processedBy: req.userId,
      processedByName: req.user.fullName
    });

    // Actualizar factura asociada
    const invoice = await SupplierInvoice.findById(payable.invoiceId);
    if (invoice) {
      invoice.amountPaid += amount;
      await invoice.save();
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'payment_recorded',
      module: 'purchases',
      description: `Pago registrado: ${payable.supplierName} - Factura ${payable.invoiceNumber} ($${amount.toFixed(2)})`,
      details: { 
        payableId: payable._id,
        invoiceNumber: payable.invoiceNumber,
        amount,
        paymentMethod
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: payable,
      message: 'Pago registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al registrar pago' 
    });
  }
};

// Obtener resumen de cuentas por pagar
export const getPayablesSummary = async (req, res) => {
  try {
    const today = new Date();
    
    // Total pendiente
    const totalPending = await PayableAccount.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'partial', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountDue' }
        }
      }
    ]);

    // Vencidas
    const overdue = await PayableAccount.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'partial', 'overdue'] },
          dueDate: { $lt: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountDue' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Por vencer en 7 días
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const dueSoon = await PayableAccount.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'partial'] },
          dueDate: { 
            $gte: today,
            $lte: sevenDaysFromNow 
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountDue' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Por proveedor
    const bySupplier = await PayableAccount.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'partial', 'overdue'] }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          total: { $sum: '$amountDue' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPending: totalPending[0]?.total || 0,
        overdue: {
          total: overdue[0]?.total || 0,
          count: overdue[0]?.count || 0
        },
        dueSoon: {
          total: dueSoon[0]?.total || 0,
          count: dueSoon[0]?.count || 0
        },
        bySupplier
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener resumen' 
    });
  }
};

// Actualizar cuenta por pagar
export const updatePayable = async (req, res) => {
  try {
    const payable = await PayableAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!payable) {
      return res.status(404).json({ 
        success: false,
        message: 'Cuenta por pagar no encontrada' 
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'payable_account_updated',
      module: 'purchases',
      description: `Cuenta por pagar actualizada: ${payable.invoiceNumber}`,
      details: { payableId: payable._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: payable,
      message: 'Cuenta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar cuenta' 
    });
  }
};

// Eliminar cuenta por pagar
export const deletePayable = async (req, res) => {
  try {
    const payable = await PayableAccount.findById(req.params.id);

    if (!payable) {
      return res.status(404).json({ 
        success: false,
        message: 'Cuenta por pagar no encontrada' 
      });
    }

    // No permitir eliminar si ya tiene pagos
    if (payable.amountPaid > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cuenta con pagos registrados'
      });
    }

    await PayableAccount.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'payable_account_deleted',
      module: 'purchases',
      description: `Cuenta por pagar eliminada: ${payable.invoiceNumber}`,
      details: { payableId: payable._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar cuenta' 
    });
  }
};
