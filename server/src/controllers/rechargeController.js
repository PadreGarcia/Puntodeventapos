import PhoneRecharge from '../models/PhoneRecharge.js';
import RechargeCarrier from '../models/RechargeCarrier.js';
import RechargeProduct from '../models/RechargeProduct.js';
import Customer from '../models/Customer.js';
import CashRegister from '../models/CashRegister.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// GESTIÓN DE OPERADORES
// ==========================================

// Obtener todos los operadores
export const getAllCarriers = async (req, res) => {
  try {
    const { active_only } = req.query;
    
    const query = active_only === 'true' ? { active: true } : {};
    
    const carriers = await RechargeCarrier.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      count: carriers.length,
      data: carriers
    });
  } catch (error) {
    console.error('Error al obtener operadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener operadores',
      error: error.message
    });
  }
};

// Crear operador (solo Admin)
export const createCarrier = async (req, res) => {
  try {
    const carrier = await RechargeCarrier.create(req.body);
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'recharges',
      description: `Creó operador: ${carrier.name}`,
      details: { carrierId: carrier._id },
      success: true,
      criticality: 'medium'
    });
    
    res.status(201).json({
      success: true,
      message: 'Operador creado exitosamente',
      data: carrier
    });
  } catch (error) {
    console.error('Error al crear operador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear operador',
      error: error.message
    });
  }
};

// Actualizar operador
export const updateCarrier = async (req, res) => {
  try {
    const carrier = await RechargeCarrier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: 'Operador no encontrado'
      });
    }
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'recharges',
      description: `Actualizó operador: ${carrier.name}`,
      details: { carrierId: carrier._id, changes: req.body },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Operador actualizado exitosamente',
      data: carrier
    });
  } catch (error) {
    console.error('Error al actualizar operador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar operador',
      error: error.message
    });
  }
};

// ==========================================
// GESTIÓN DE PRODUCTOS
// ==========================================

// Obtener productos de recarga
export const getProducts = async (req, res) => {
  try {
    const { carrier_id, type, active_only } = req.query;
    
    let query = {};
    
    if (carrier_id) {
      query.carrier = carrier_id;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (active_only === 'true') {
      query.active = true;
    }
    
    const products = await RechargeProduct.find(query)
      .populate('carrier', 'name code color')
      .sort({ type: 1, price: 1 });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Crear producto (solo Admin)
export const createProduct = async (req, res) => {
  try {
    const product = await RechargeProduct.create(req.body);
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'recharges',
      description: `Creó producto de recarga: ${product.name}`,
      details: { productId: product._id },
      success: true,
      criticality: 'low'
    });
    
    const populatedProduct = await RechargeProduct.findById(product._id)
      .populate('carrier', 'name code color');
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const product = await RechargeProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('carrier', 'name code color');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'recharges',
      description: `Actualizó producto: ${product.name}`,
      details: { productId: product._id, changes: req.body },
      success: true,
      criticality: 'low'
    });
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// ==========================================
// PROCESAMIENTO DE RECARGAS
// ==========================================

// Crear nueva recarga
export const createRecharge = async (req, res) => {
  try {
    const {
      carrierId,
      phoneNumber,
      productId,
      paymentMethod,
      receivedAmount,
      customerId,
      cashRegisterId
    } = req.body;
    
    // Validar número telefónico
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Número telefónico inválido (debe tener 10 dígitos)'
      });
    }
    
    // Obtener operador
    const carrier = await RechargeCarrier.findById(carrierId);
    if (!carrier || !carrier.active) {
      return res.status(400).json({
        success: false,
        message: 'Operador no disponible'
      });
    }
    
    // Obtener producto
    const product = await RechargeProduct.findById(productId);
    if (!product || !product.active) {
      return res.status(400).json({
        success: false,
        message: 'Producto no disponible'
      });
    }
    
    // Validar que el producto pertenece al operador
    if (product.carrier.toString() !== carrierId) {
      return res.status(400).json({
        success: false,
        message: 'El producto no pertenece al operador seleccionado'
      });
    }
    
    // Calcular comisión
    const commission = product.price * carrier.commissionRate;
    
    // Validar pago en efectivo
    if (paymentMethod === 'cash') {
      if (!receivedAmount || receivedAmount < product.price) {
        return res.status(400).json({
          success: false,
          message: 'Monto recibido insuficiente'
        });
      }
    }
    
    // Obtener datos del cliente si existe
    let customerName = null;
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerName = customer.name;
      }
    }
    
    // Verificar caja registradora si se proporciona
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
    const confirmationCode = await PhoneRecharge.generateConfirmationCode(carrier.code);
    
    // Crear recarga
    const rechargeData = {
      carrier: carrierId,
      carrierName: carrier.name,
      phoneNumber,
      customerId: customerId || undefined,
      customerName,
      product: productId,
      productType: product.type,
      productName: product.name,
      amount: product.price,
      commission,
      commissionRate: carrier.commissionRate,
      paymentMethod,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : product.price,
      changeGiven: paymentMethod === 'cash' ? receivedAmount - product.price : 0,
      status: 'pending',
      confirmationCode,
      processedBy: req.user._id,
      operatorName: req.user.fullName,
      cashRegister: cashRegisterId || undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
    
    const recharge = await PhoneRecharge.create(rechargeData);
    
    // TODO: Aquí iría la integración con API externa del operador
    // Por ahora marcamos como completada automáticamente
    await recharge.complete();
    
    // Registrar en caja si existe
    if (cashRegisterId) {
      const cashRegister = await CashRegister.findById(cashRegisterId);
      if (cashRegister) {
        // Agregar ingreso
        cashRegister.transactions.push({
          type: 'recharge',
          description: `Recarga ${carrier.name} - ${phoneNumber}`,
          amount: product.price,
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
      module: 'recharges',
      description: `Procesó recarga ${carrier.name} - ${phoneNumber}`,
      details: {
        rechargeId: recharge._id,
        confirmationCode,
        amount: product.price,
        commission,
        phoneNumber
      },
      success: true,
      criticality: 'medium'
    });
    
    // Poblar datos para respuesta
    const populatedRecharge = await PhoneRecharge.findById(recharge._id)
      .populate('carrier', 'name code color')
      .populate('product', 'name description type')
      .populate('processedBy', 'username fullName')
      .populate('customerId', 'name phone');
    
    res.status(201).json({
      success: true,
      message: 'Recarga procesada exitosamente',
      data: populatedRecharge
    });
  } catch (error) {
    console.error('Error al procesar recarga:', error);
    
    // Registrar auditoría de falla
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'recharges',
      description: 'Intento fallido de procesar recarga',
      details: { error: error.message, body: req.body },
      success: false,
      criticality: 'high'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar recarga',
      error: error.message
    });
  }
};

// Obtener todas las recargas
export const getAllRecharges = async (req, res) => {
  try {
    const { 
      status, 
      carrier_id, 
      phone_number, 
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
    
    if (carrier_id) {
      query.carrier = carrier_id;
    }
    
    if (phone_number) {
      query.phoneNumber = phone_number;
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
    
    const [recharges, total] = await Promise.all([
      PhoneRecharge.find(query)
        .populate('carrier', 'name code color')
        .populate('product', 'name description type')
        .populate('processedBy', 'username fullName')
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      PhoneRecharge.countDocuments(query)
    ]);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'view',
      module: 'recharges',
      description: 'Consultó historial de recargas',
      success: true,
      criticality: 'low'
    });
    
    res.json({
      success: true,
      count: recharges.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: recharges
    });
  } catch (error) {
    console.error('Error al obtener recargas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recargas',
      error: error.message
    });
  }
};

// Obtener recarga por ID
export const getRechargeById = async (req, res) => {
  try {
    const recharge = await PhoneRecharge.findById(req.params.id)
      .populate('carrier', 'name code color')
      .populate('product', 'name description type price')
      .populate('processedBy', 'username fullName')
      .populate('customerId', 'name phone email')
      .populate('cashRegister', 'name shift');
    
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: 'Recarga no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: recharge
    });
  } catch (error) {
    console.error('Error al obtener recarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recarga',
      error: error.message
    });
  }
};

// Obtener recarga por código de confirmación
export const getRechargeByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const recharge = await PhoneRecharge.findOne({ 
      confirmationCode: code.toUpperCase() 
    })
      .populate('carrier', 'name code color')
      .populate('product', 'name description type price')
      .populate('processedBy', 'username fullName');
    
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: 'Recarga no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: recharge
    });
  } catch (error) {
    console.error('Error al obtener recarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recarga',
      error: error.message
    });
  }
};

// Obtener estadísticas del día
export const getDailyStats = async (req, res) => {
  try {
    const { date, user_id } = req.query;
    
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
    
    const recharges = await PhoneRecharge.find(query);
    
    const stats = {
      date: startOfDay,
      totalRecharges: recharges.length,
      totalAmount: recharges.reduce((sum, r) => sum + r.amount, 0),
      totalCommission: recharges.reduce((sum, r) => sum + r.commission, 0),
      byCarrier: {},
      byType: {
        airtime: 0,
        data: 0,
        social: 0,
        unlimited: 0
      },
      byPaymentMethod: {
        cash: 0,
        card: 0,
        transfer: 0,
        nfc: 0
      }
    };
    
    // Agrupar por operador
    recharges.forEach(recharge => {
      // Por operador
      if (!stats.byCarrier[recharge.carrierName]) {
        stats.byCarrier[recharge.carrierName] = {
          count: 0,
          amount: 0,
          commission: 0
        };
      }
      stats.byCarrier[recharge.carrierName].count++;
      stats.byCarrier[recharge.carrierName].amount += recharge.amount;
      stats.byCarrier[recharge.carrierName].commission += recharge.commission;
      
      // Por tipo
      if (recharge.productType in stats.byType) {
        stats.byType[recharge.productType]++;
      }
      
      // Por método de pago
      if (recharge.paymentMethod in stats.byPaymentMethod) {
        stats.byPaymentMethod[recharge.paymentMethod]++;
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

// Obtener historial por número de teléfono
export const getRechargesByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Número telefónico inválido'
      });
    }
    
    const recharges = await PhoneRecharge.find({ phoneNumber })
      .populate('carrier', 'name code color')
      .populate('product', 'name description type')
      .populate('processedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: recharges.length,
      phoneNumber,
      data: recharges
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

// Cancelar recarga (solo Admin/Supervisor)
export const cancelRecharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const recharge = await PhoneRecharge.findById(id);
    
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: 'Recarga no encontrada'
      });
    }
    
    if (recharge.status === 'cancelled' || recharge.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'La recarga ya fue cancelada o reembolsada'
      });
    }
    
    await recharge.cancel(reason);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'delete',
      module: 'recharges',
      description: `Canceló recarga ${recharge.confirmationCode}`,
      details: {
        rechargeId: recharge._id,
        confirmationCode: recharge.confirmationCode,
        reason
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Recarga cancelada exitosamente',
      data: recharge
    });
  } catch (error) {
    console.error('Error al cancelar recarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar recarga',
      error: error.message
    });
  }
};

// Validar número telefónico
export const validatePhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    const isValid = /^[0-9]{10}$/.test(phoneNumber);
    
    if (!isValid) {
      return res.json({
        success: true,
        valid: false,
        message: 'Número telefónico inválido (debe tener 10 dígitos)'
      });
    }
    
    // Buscar historial
    const rechargesCount = await PhoneRecharge.countDocuments({ 
      phoneNumber,
      status: 'completed'
    });
    
    // Buscar cliente asociado
    const customer = await Customer.findOne({ phone: phoneNumber });
    
    res.json({
      success: true,
      valid: true,
      phoneNumber,
      history: {
        totalRecharges: rechargesCount
      },
      customer: customer ? {
        id: customer._id,
        name: customer.name,
        tier: customer.loyaltyTier
      } : null
    });
  } catch (error) {
    console.error('Error al validar número:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar número',
      error: error.message
    });
  }
};
