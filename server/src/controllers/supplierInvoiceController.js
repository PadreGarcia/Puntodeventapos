import SupplierInvoice from '../models/SupplierInvoice.js';
import PayableAccount from '../models/PayableAccount.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todas las facturas
export const getInvoices = async (req, res) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }
    
    const invoices = await SupplierInvoice.find(filter).sort({ invoiceDate: -1 });
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener facturas' 
    });
  }
};

// Obtener factura por ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Factura no encontrada' 
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener factura' 
    });
  }
};

// Crear factura de proveedor
export const createInvoice = async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      createdBy: req.userId,
      createdByName: req.user.fullName
    };
    
    // Calcular fecha de vencimiento si no viene
    if (!invoiceData.dueDate) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const paymentTerms = invoiceData.paymentTerms || 30;
      invoiceData.dueDate = new Date(invoiceDate.setDate(invoiceDate.getDate() + paymentTerms));
    }
    
    const invoice = await SupplierInvoice.create(invoiceData);

    // Crear cuenta por pagar automáticamente
    await PayableAccount.create({
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      amount: invoice.total,
      amountPaid: 0,
      amountDue: invoice.total,
      status: 'pending'
    });

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'supplier_invoice_created',
      module: 'purchases',
      description: `Factura registrada: ${invoice.invoiceNumber} - ${invoice.supplierName}`,
      details: { 
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Factura registrada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ 
      success: false,
      message: error.code === 11000 ? 'El número de factura ya existe' : 'Error al crear factura' 
    });
  }
};

// Actualizar factura
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Factura no encontrada' 
      });
    }

    // Actualizar cuenta por pagar correspondiente
    await PayableAccount.findOneAndUpdate(
      { invoiceId: invoice._id },
      {
        amount: invoice.total,
        amountDue: invoice.total - invoice.amountPaid,
        dueDate: invoice.dueDate
      }
    );

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'supplier_invoice_updated',
      module: 'purchases',
      description: `Factura actualizada: ${invoice.invoiceNumber}`,
      details: { invoiceId: invoice._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: invoice,
      message: 'Factura actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar factura' 
    });
  }
};

// Registrar pago de factura
export const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const invoice = await SupplierInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Factura no encontrada' 
      });
    }

    // Validar monto
    const remainingAmount = invoice.total - invoice.amountPaid;
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `El monto excede lo pendiente ($${remainingAmount.toFixed(2)})`
      });
    }

    // Actualizar factura
    invoice.amountPaid += amount;
    await invoice.save();

    // Actualizar cuenta por pagar
    const payable = await PayableAccount.findOne({ invoiceId: invoice._id });
    if (payable) {
      await payable.addPayment({
        amount,
        paymentMethod: req.body.paymentMethod,
        reference: req.body.reference,
        notes: req.body.notes,
        processedBy: req.userId,
        processedByName: req.user.fullName
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'invoice_payment_recorded',
      module: 'purchases',
      description: `Pago registrado para factura ${invoice.invoiceNumber}: $${amount.toFixed(2)}`,
      details: { 
        invoiceId: invoice._id,
        amount,
        paymentMethod: req.body.paymentMethod
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: invoice,
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

// Eliminar factura
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Factura no encontrada' 
      });
    }

    // No permitir eliminar si ya tiene pagos
    if (invoice.amountPaid > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una factura con pagos registrados'
      });
    }

    // Eliminar cuenta por pagar asociada
    await PayableAccount.findOneAndDelete({ invoiceId: invoice._id });

    await SupplierInvoice.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'supplier_invoice_deleted',
      module: 'purchases',
      description: `Factura eliminada: ${invoice.invoiceNumber}`,
      details: { invoiceId: invoice._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      message: 'Factura eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar factura' 
    });
  }
};

// Obtener facturas vencidas
export const getOverdueInvoices = async (req, res) => {
  try {
    const today = new Date();
    const invoices = await SupplierInvoice.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: today }
    }).sort({ dueDate: 1 });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error al obtener facturas vencidas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener facturas vencidas' 
    });
  }
};
