import AccountReceivable from '../models/AccountReceivable.js';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';

// ==================== GESTIÓN DE CUENTAS POR COBRAR ====================

// Listar cuentas por cobrar
export const getAccountsReceivable = async (req, res) => {
  try {
    const { status, customerId, startDate, endDate, overdue } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    if (overdue === 'true') {
      filter.status = 'overdue';
    }

    const receivables = await AccountReceivable.find(filter)
      .populate('customerId', 'name phone email creditLimit currentCredit')
      .sort({ saleDate: -1 });

    // Actualizar status de vencidos
    const today = new Date();
    for (const receivable of receivables) {
      if (new Date(receivable.dueDate) < today && 
          receivable.status !== 'paid' && 
          receivable.status !== 'cancelled') {
        receivable.status = 'overdue';
        if (receivable.interestRate > 0) {
          receivable.calculateInterest();
        }
        await receivable.save();
      }
    }

    res.json({
      success: true,
      data: receivables
    });
  } catch (error) {
    console.error('Error al obtener cuentas por cobrar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas por cobrar'
    });
  }
};

// Obtener cuenta por cobrar por ID
export const getAccountReceivableById = async (req, res) => {
  try {
    const receivable = await AccountReceivable.findById(req.params.id)
      .populate('customerId', 'name phone email address creditLimit currentCredit');

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta por cobrar no encontrada'
      });
    }

    // Actualizar intereses si aplica
    receivable.checkOverdue();
    if (receivable.status === 'overdue' && receivable.interestRate > 0) {
      receivable.calculateInterest();
      await receivable.save();
    }

    res.json({
      success: true,
      data: receivable
    });
  } catch (error) {
    console.error('Error al obtener cuenta por cobrar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta por cobrar'
    });
  }
};

// Crear cuenta por cobrar (fiado)
export const createAccountReceivable = async (req, res) => {
  try {
    const {
      customerId,
      saleId,
      totalAmount,
      paymentTermDays,
      interestRate,
      notes
    } = req.body;

    // Verificar cliente
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar límite de crédito
    const availableCredit = customer.creditLimit - customer.currentCredit;
    if (totalAmount > availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Límite de crédito insuficiente. Disponible: $${availableCredit.toFixed(2)}`
      });
    }

    // Generar número de factura
    const invoiceNumber = await AccountReceivable.generateInvoiceNumber();

    // Calcular fecha de vencimiento
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (paymentTermDays || 30));

    const receivableData = {
      invoiceNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      saleId,
      totalAmount,
      remainingAmount: totalAmount,
      dueDate,
      paymentTermDays: paymentTermDays || 30,
      interestRate: interestRate || 0,
      createdBy: req.userId,
      createdByName: req.user.fullName,
      notes
    };

    const receivable = await AccountReceivable.create(receivableData);

    // Actualizar crédito del cliente
    customer.currentCredit += totalAmount;
    await customer.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'account_receivable_created',
      module: 'receivables',
      description: `Cuenta por cobrar creada: ${invoiceNumber} - ${customer.name} - $${totalAmount.toFixed(2)}`,
      details: {
        receivableId: receivable._id,
        invoiceNumber,
        customerId: customer._id,
        customerName: customer.name,
        totalAmount,
        dueDate
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: receivable,
      message: 'Cuenta por cobrar creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cuenta por cobrar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cuenta por cobrar'
    });
  }
};

// Registrar pago
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const receivable = await AccountReceivable.findById(req.params.id);

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta por cobrar no encontrada'
      });
    }

    if (receivable.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta ya está pagada'
      });
    }

    if (receivable.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta está cancelada'
      });
    }

    if (amount > receivable.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `El monto excede el saldo pendiente de $${receivable.remainingAmount.toFixed(2)}`
      });
    }

    // Registrar pago
    await receivable.recordPayment({
      amount,
      paymentMethod,
      reference,
      receivedBy: req.userId,
      receivedByName: req.user.fullName,
      notes
    });

    // Actualizar crédito del cliente
    const customer = await Customer.findById(receivable.customerId);
    if (customer) {
      customer.currentCredit -= amount;
      if (customer.currentCredit < 0) customer.currentCredit = 0;
      await customer.save();
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'payment_recorded',
      module: 'receivables',
      description: `Pago registrado: ${receivable.invoiceNumber} - $${amount.toFixed(2)}`,
      details: {
        receivableId: receivable._id,
        invoiceNumber: receivable.invoiceNumber,
        amount,
        paymentMethod,
        remainingAmount: receivable.remainingAmount,
        status: receivable.status
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: receivable,
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

// Cancelar cuenta por cobrar
export const cancelAccountReceivable = async (req, res) => {
  try {
    const { reason } = req.body;
    const receivable = await AccountReceivable.findById(req.params.id);

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta por cobrar no encontrada'
      });
    }

    if (receivable.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una cuenta pagada'
      });
    }

    const previousStatus = receivable.status;
    const remainingAmount = receivable.remainingAmount;

    receivable.status = 'cancelled';
    receivable.cancellationReason = reason;
    await receivable.save();

    // Liberar crédito del cliente
    const customer = await Customer.findById(receivable.customerId);
    if (customer) {
      customer.currentCredit -= remainingAmount;
      if (customer.currentCredit < 0) customer.currentCredit = 0;
      await customer.save();
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'account_receivable_cancelled',
      module: 'receivables',
      description: `Cuenta cancelada: ${receivable.invoiceNumber} - ${reason}`,
      details: {
        receivableId: receivable._id,
        invoiceNumber: receivable.invoiceNumber,
        previousStatus,
        remainingAmount,
        reason
      },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      data: receivable,
      message: 'Cuenta por cobrar cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar cuenta por cobrar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar cuenta por cobrar'
    });
  }
};

// Obtener resumen de cuentas por cobrar
export const getReceivablesSummary = async (req, res) => {
  try {
    const total = await AccountReceivable.countDocuments();
    const pending = await AccountReceivable.countDocuments({ status: 'pending' });
    const overdue = await AccountReceivable.countDocuments({ status: 'overdue' });
    const paid = await AccountReceivable.countDocuments({ status: 'paid' });

    // Totales monetarios
    const pendingAmount = await AccountReceivable.aggregate([
      { $match: { status: { $in: ['pending', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);

    const overdueAmount = await AccountReceivable.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);

    const collectedAmount = await AccountReceivable.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    // Clientes con cuentas pendientes
    const customersWithDebt = await AccountReceivable.distinct('customerId', {
      status: { $in: ['pending', 'partial', 'overdue'] }
    });

    const summary = {
      counts: {
        total,
        pending,
        overdue,
        paid,
        partial: await AccountReceivable.countDocuments({ status: 'partial' })
      },
      amounts: {
        pending: pendingAmount[0]?.total || 0,
        overdue: overdueAmount[0]?.total || 0,
        collected: collectedAmount[0]?.total || 0
      },
      customersWithDebt: customersWithDebt.length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen'
    });
  }
};

// Obtener cuentas vencidas
export const getOverdueAccounts = async (req, res) => {
  try {
    const receivables = await AccountReceivable.find({
      status: { $in: ['overdue', 'partial'] },
      dueDate: { $lt: new Date() }
    })
      .populate('customerId', 'name phone email')
      .sort({ dueDate: 1 });

    // Actualizar intereses
    for (const receivable of receivables) {
      receivable.checkOverdue();
      if (receivable.interestRate > 0) {
        receivable.calculateInterest();
      }
      await receivable.save();
    }

    res.json({
      success: true,
      data: receivables
    });
  } catch (error) {
    console.error('Error al obtener cuentas vencidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas vencidas'
    });
  }
};

// Actualizar tasa de interés
export const updateInterestRate = async (req, res) => {
  try {
    const { interestRate } = req.body;
    const receivable = await AccountReceivable.findById(req.params.id);

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta por cobrar no encontrada'
      });
    }

    receivable.interestRate = interestRate;
    receivable.calculateInterest();
    await receivable.save();

    res.json({
      success: true,
      data: receivable,
      message: 'Tasa de interés actualizada'
    });
  } catch (error) {
    console.error('Error al actualizar tasa de interés:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tasa de interés'
    });
  }
};

// Obtener historial de pagos de un cliente
export const getCustomerPaymentHistory = async (req, res) => {
  try {
    const receivables = await AccountReceivable.find({
      customerId: req.params.customerId
    }).sort({ saleDate: -1 });

    const history = receivables.map(r => ({
      invoiceNumber: r.invoiceNumber,
      saleDate: r.saleDate,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount,
      status: r.status,
      dueDate: r.dueDate,
      payments: r.payments
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};
