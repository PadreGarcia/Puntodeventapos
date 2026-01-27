import ServicePayment from '../models/ServicePayment.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Customer from '../models/Customer.js';
import CashRegister from '../models/CashRegister.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// GESTIÓN DE PROVEEDORES
// ==========================================

// Obtener todos los proveedores
export const getAllProviders = async (req, res) => {
  try {
    const { category, active_only } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (active_only === 'true') {
      query.active = true;
    }
    
    const providers = await ServiceProvider.find(query).sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      count: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

// Obtener proveedor por ID
export const getProviderById = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

// Crear proveedor (solo Admin)
export const createProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.create(req.body);
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'services',
      description: `Creó proveedor de servicio: ${provider.name}`,
      details: { providerId: provider._id },
      success: true,
      criticality: 'medium'
    });
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: provider
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

// Actualizar proveedor
export const updateProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'services',
      description: `Actualizó proveedor: ${provider.name}`,
      details: { providerId: provider._id, changes: req.body },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: provider
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

// ==========================================
// PROCESAMIENTO DE PAGOS
// ==========================================

// Crear pago de servicio
export const createServicePayment = async (req, res) => {
  try {
    const {
      providerId,
      reference,
      accountName,
      amount,
      customerPhone,
      customerEmail,
      paymentMethod,
      receivedAmount,
      customerId,
      cashRegisterId,
      notes
    } = req.body;
    
    // Validar proveedor
    const provider = await ServiceProvider.findById(providerId);
    if (!provider || !provider.active) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor no disponible'
      });
    }
    
    // Validar monto
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto inválido'
      });
    }
    
    if (provider.minAmount && amount < provider.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Monto mínimo: $${provider.minAmount}`
      });
    }
    
    if (provider.maxAmount && amount > provider.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Monto máximo: $${provider.maxAmount}`
      });
    }
    
    // Validar referencia
    if (!reference || reference.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Número de referencia requerido'
      });
    }
    
    if (provider.referenceLength && reference.length !== provider.referenceLength) {
      return res.status(400).json({
        success: false,
        message: `La referencia debe tener ${provider.referenceLength} dígitos`
      });
    }
    
    // Validar teléfono si es requerido
    if (provider.requiresPhone && (!customerPhone || customerPhone.length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono requerido'
      });
    }
    
    // Validar email si es requerido
    if (provider.requiresEmail && (!customerEmail || !customerEmail.includes('@'))) {
      return res.status(400).json({
        success: false,
        message: 'Email válido requerido'
      });
    }
    
    // Calcular comisión
    let commission = 0;
    if (provider.commissionFixed) {
      commission += provider.commissionFixed;
    }
    if (provider.commission) {
      commission += (amount * provider.commission) / 100;
    }
    
    const total = amount + commission;
    
    // Validar pago en efectivo
    if (paymentMethod === 'cash') {
      if (!receivedAmount || receivedAmount < total) {
        return res.status(400).json({
          success: false,
          message: 'Monto recibido insuficiente'
        });
      }
    }
    
    // Verificar caja si se proporciona
    if (cashRegisterId) {
      const cashRegister = await CashRegister.findById(cashRegisterId);
      if (!cashRegister || cashRegister.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'La caja no está abierta'
        });
      }
    }
    
    // Generar código de confirmación
    const confirmationCode = await ServicePayment.generateConfirmationCode();
    
    // Crear pago
    const paymentData = {
      provider: providerId,
      providerId: provider.code,
      providerName: provider.name,
      category: provider.category,
      reference,
      accountName: accountName || undefined,
      customerId: customerId || undefined,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      amount,
      commission,
      total,
      paymentMethod,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : total,
      changeGiven: paymentMethod === 'cash' ? receivedAmount - total : 0,
      status: 'pending',
      confirmationCode,
      processedBy: req.user._id,
      operatorName: req.user.fullName,
      cashRegister: cashRegisterId || undefined,
      notes: notes || undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
    
    const payment = await ServicePayment.create(paymentData);
    
    // TODO: Aquí ir��a la integración con API externa del proveedor
    // Por ahora marcamos como completado automáticamente
    await payment.complete();
    
    // Registrar en caja si existe
    if (cashRegisterId) {
      const cashRegister = await CashRegister.findById(cashRegisterId);
      if (cashRegister) {
        cashRegister.transactions.push({
          type: 'service',
          description: `Servicio ${provider.name} - ${reference}`,
          amount: total,
          paymentMethod,
          reference: confirmationCode,
          userId: req.user._id,
          userName: req.user.fullName
        });
        await cashRegister.save();
      }
    }
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'services',
      description: `Procesó pago de servicio ${provider.name} - ${reference}`,
      details: {
        paymentId: payment._id,
        confirmationCode,
        provider: provider.name,
        category: provider.category,
        amount,
        commission,
        total
      },
      success: true,
      criticality: 'medium'
    });
    
    // Poblar datos para respuesta
    const populatedPayment = await ServicePayment.findById(payment._id)
      .populate('provider', 'name code category icon color')
      .populate('processedBy', 'username fullName')
      .populate('customerId', 'name phone email');
    
    res.status(201).json({
      success: true,
      message: 'Pago de servicio procesado exitosamente',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Error al procesar pago de servicio:', error);
    
    // Registrar auditoría de falla
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'services',
      description: 'Intento fallido de procesar pago de servicio',
      details: { error: error.message, body: req.body },
      success: false,
      criticality: 'high'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar pago de servicio',
      error: error.message
    });
  }
};

// Obtener todos los pagos
export const getAllPayments = async (req, res) => {
  try {
    const {
      status,
      provider_id,
      category,
      reference,
      date_from,
      date_to,
      user_id,
      limit = 100,
      page = 1
    } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (provider_id) {
      query.provider = provider_id;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (reference) {
      query.reference = { $regex: reference, $options: 'i' };
    }
    
    if (user_id) {
      query.processedBy = user_id;
    }
    
    // Filtro de fechas
    if (date_from || date_to) {
      query.createdAt = {};
      if (date_from) {
        query.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [payments, total] = await Promise.all([
      ServicePayment.find(query)
        .populate('provider', 'name code category icon color')
        .populate('processedBy', 'username fullName')
        .populate('customerId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      ServicePayment.countDocuments(query)
    ]);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'view',
      module: 'services',
      description: 'Consultó historial de pagos de servicios',
      success: true,
      criticality: 'low'
    });
    
    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: payments
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

// Obtener pago por ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await ServicePayment.findById(req.params.id)
      .populate('provider', 'name code category icon color')
      .populate('processedBy', 'username fullName')
      .populate('customerId', 'name phone email')
      .populate('cashRegister', 'name shift');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

// Obtener pago por código de confirmación
export const getPaymentByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const payment = await ServicePayment.findOne({
      confirmationCode: code.toUpperCase()
    })
      .populate('provider', 'name code category icon color')
      .populate('processedBy', 'username fullName');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

// Obtener estadísticas del día
export const getDailyStats = async (req, res) => {
  try {
    const { date, user_id, category } = req.query;
    
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);
    
    let query = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'completed'
    };
    
    if (user_id) {
      query.processedBy = user_id;
    }
    
    if (category) {
      query.category = category;
    }
    
    const payments = await ServicePayment.find(query);
    
    const stats = {
      date: startOfDay,
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCommission: payments.reduce((sum, p) => sum + p.commission, 0),
      totalRevenue: payments.reduce((sum, p) => sum + p.total, 0),
      
      byCategory: {
        energy: 0,
        telecom: 0,
        water_gas: 0,
        government: 0,
        entertainment: 0,
        financial: 0
      },
      
      byProvider: {},
      
      byPaymentMethod: {
        cash: 0,
        card: 0,
        transfer: 0,
        nfc: 0
      }
    };
    
    // Agrupar por categoría y proveedor
    payments.forEach(payment => {
      // Por categoría
      if (payment.category in stats.byCategory) {
        stats.byCategory[payment.category]++;
      }
      
      // Por proveedor
      if (!stats.byProvider[payment.providerName]) {
        stats.byProvider[payment.providerName] = {
          count: 0,
          amount: 0,
          commission: 0,
          total: 0
        };
      }
      stats.byProvider[payment.providerName].count++;
      stats.byProvider[payment.providerName].amount += payment.amount;
      stats.byProvider[payment.providerName].commission += payment.commission;
      stats.byProvider[payment.providerName].total += payment.total;
      
      // Por método de pago
      if (payment.paymentMethod in stats.byPaymentMethod) {
        stats.byPaymentMethod[payment.paymentMethod]++;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Obtener historial por referencia
export const getPaymentsByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const payments = await ServicePayment.find({
      reference: { $regex: reference, $options: 'i' }
    })
      .populate('provider', 'name code category')
      .populate('processedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: payments.length,
      reference,
      data: payments
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

// Cancelar pago (solo Admin/Supervisor)
export const cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await ServicePayment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'El pago ya fue cancelado o reembolsado'
      });
    }
    
    await payment.cancel(reason);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'delete',
      module: 'services',
      description: `Canceló pago de servicio ${payment.confirmationCode}`,
      details: {
        paymentId: payment._id,
        confirmationCode: payment.confirmationCode,
        reason
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Pago cancelado exitosamente',
      data: payment
    });
  } catch (error) {
    console.error('Error al cancelar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pago',
      error: error.message
    });
  }
};

// Validar referencia de servicio
export const validateReference = async (req, res) => {
  try {
    const { providerId, reference } = req.body;
    
    if (!providerId || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor y referencia son requeridos'
      });
    }
    
    const provider = await ServiceProvider.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Validar longitud
    if (provider.referenceLength && reference.length !== provider.referenceLength) {
      return res.json({
        success: true,
        valid: false,
        message: `La referencia debe tener ${provider.referenceLength} dígitos`
      });
    }
    
    // Buscar pagos previos con esta referencia
    const previousPayments = await ServicePayment.countDocuments({
      provider: providerId,
      reference,
      status: 'completed'
    });
    
    res.json({
      success: true,
      valid: true,
      reference,
      provider: provider.name,
      history: {
        totalPayments: previousPayments
      }
    });
  } catch (error) {
    console.error('Error al validar referencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar referencia',
      error: error.message
    });
  }
};

// Obtener reporte de comisiones
export const getCommissionsReport = async (req, res) => {
  try {
    const { date_from, date_to, category, provider_id } = req.query;
    
    let query = { status: 'completed' };
    
    if (category) {
      query.category = category;
    }
    
    if (provider_id) {
      query.provider = provider_id;
    }
    
    // Filtro de fechas
    if (date_from || date_to) {
      query.createdAt = {};
      if (date_from) {
        query.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    const payments = await ServicePayment.find(query)
      .populate('provider', 'name category');
    
    const report = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCommission: payments.reduce((sum, p) => sum + p.commission, 0),
      totalRevenue: payments.reduce((sum, p) => sum + p.total, 0),
      byProvider: {},
      byCategory: {}
    };
    
    payments.forEach(payment => {
      // Por proveedor
      const providerName = payment.provider?.name || payment.providerName;
      if (!report.byProvider[providerName]) {
        report.byProvider[providerName] = {
          count: 0,
          amount: 0,
          commission: 0
        };
      }
      report.byProvider[providerName].count++;
      report.byProvider[providerName].amount += payment.amount;
      report.byProvider[providerName].commission += payment.commission;
      
      // Por categoría
      if (!report.byCategory[payment.category]) {
        report.byCategory[payment.category] = {
          count: 0,
          amount: 0,
          commission: 0
        };
      }
      report.byCategory[payment.category].count++;
      report.byCategory[payment.category].amount += payment.amount;
      report.byCategory[payment.category].commission += payment.commission;
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};
