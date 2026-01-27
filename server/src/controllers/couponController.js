import Coupon from '../models/Coupon.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// CRUD DE CUPONES
// ==========================================

// Obtener todos los cupones
export const getAllCoupons = async (req, res) => {
  try {
    const { status, type, customer_id } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (customer_id) {
      query.$or = [
        { customerIds: { $size: 0 } }, // Sin restricción de clientes
        { customerIds: customer_id }    // O incluye al cliente
      ];
    }
    
    const coupons = await Coupon.find(query)
      .populate('productIds', 'name price image')
      .populate('customerIds', 'name phone')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'view',
      module: 'promotions',
      description: 'Consultó lista de cupones',
      success: true,
      criticality: 'low'
    });
    
    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    console.error('Error al obtener cupones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cupones',
      error: error.message
    });
  }
};

// Obtener cupón por ID
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('productIds', 'name price image stock')
      .populate('customerIds', 'name phone email')
      .populate('createdBy', 'username fullName')
      .populate('usageHistory.customerId', 'name');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error al obtener cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cupón',
      error: error.message
    });
  }
};

// Crear nuevo cupón
export const createCoupon = async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user._id,
      code: req.body.code.toUpperCase() // Asegurar mayúsculas
    };
    
    // Validar fechas
    if (new Date(couponData.startDate) >= new Date(couponData.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }
    
    // Validar que el código no exista
    const existingCoupon = await Coupon.findOne({ code: couponData.code });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cupón con ese código'
      });
    }
    
    // Validar productos si existen
    if (couponData.productIds && couponData.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: couponData.productIds } });
      if (products.length !== couponData.productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más productos no existen'
        });
      }
    }
    
    // Validar clientes si existen
    if (couponData.customerIds && couponData.customerIds.length > 0) {
      const customers = await Customer.find({ _id: { $in: couponData.customerIds } });
      if (customers.length !== couponData.customerIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más clientes no existen'
        });
      }
    }
    
    const coupon = await Coupon.create(couponData);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: `Creó cupón: ${coupon.code}`,
      details: { couponId: coupon._id, code: coupon.code, type: coupon.type },
      success: true,
      criticality: 'medium'
    });
    
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('productIds', 'name price image')
      .populate('customerIds', 'name phone')
      .populate('createdBy', 'username fullName');
    
    res.status(201).json({
      success: true,
      message: 'Cupón creado exitosamente',
      data: populatedCoupon
    });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    
    // Registrar auditoría de falla
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: 'Intento fallido de crear cupón',
      details: { error: error.message },
      success: false,
      criticality: 'medium'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al crear cupón',
      error: error.message
    });
  }
};

// Actualizar cupón
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    // No permitir cambiar el código si ya tiene usos
    if (req.body.code && req.body.code !== coupon.code && coupon.currentUsage > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el código de un cupón que ya ha sido usado'
      });
    }
    
    // Validar fechas si se actualizan
    if (req.body.startDate && req.body.endDate) {
      if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
    }
    
    // Validar código único si se cambia
    if (req.body.code && req.body.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: req.body.code.toUpperCase(),
        _id: { $ne: coupon._id }
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cupón con ese código'
        });
      }
      req.body.code = req.body.code.toUpperCase();
    }
    
    const oldData = coupon.toObject();
    
    Object.assign(coupon, req.body);
    await coupon.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'promotions',
      description: `Actualizó cupón: ${coupon.code}`,
      details: { 
        couponId: coupon._id,
        changes: req.body,
        oldData: oldData
      },
      success: true,
      criticality: 'medium'
    });
    
    const updatedCoupon = await Coupon.findById(coupon._id)
      .populate('productIds', 'name price image')
      .populate('customerIds', 'name phone')
      .populate('createdBy', 'username fullName');
    
    res.json({
      success: true,
      message: 'Cupón actualizado exitosamente',
      data: updatedCoupon
    });
  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cupón',
      error: error.message
    });
  }
};

// Eliminar cupón
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    // No permitir eliminar cupones que ya han sido usados
    if (coupon.currentUsage > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un cupón que ya ha sido usado. Considere desactivarlo en su lugar.'
      });
    }
    
    const couponCode = coupon.code;
    
    await Coupon.findByIdAndDelete(req.params.id);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'delete',
      module: 'promotions',
      description: `Eliminó cupón: ${couponCode}`,
      details: { 
        couponId: req.params.id,
        couponData: coupon.toObject()
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cupón',
      error: error.message
    });
  }
};

// ==========================================
// OPERACIONES ESPECIALES
// ==========================================

// Validar cupón (antes de aplicarlo)
export const validateCoupon = async (req, res) => {
  try {
    const { code, customerId, cartTotal, cartItems } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de cupón requerido'
      });
    }
    
    // Buscar cupón
    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
      .populate('productIds', 'name price');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    // Verificar validez general
    if (!coupon.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Este cupón ha expirado o está inactivo'
      });
    }
    
    // Verificar si el cliente puede usarlo
    if (customerId) {
      const customerCheck = coupon.canBeUsedByCustomer(customerId);
      if (!customerCheck.valid) {
        return res.status(400).json({
          success: false,
          message: customerCheck.reason
        });
      }
    }
    
    // Verificar monto mínimo
    if (coupon.minPurchaseAmount && cartTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Compra mínima de $${coupon.minPurchaseAmount} requerida`
      });
    }
    
    // Calcular descuento
    const discount = coupon.calculateDiscount(cartTotal, cartItems);
    
    res.json({
      success: true,
      valid: true,
      message: 'Cupón válido',
      data: {
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discount: discount,
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar cupón',
      error: error.message
    });
  }
};

// Aplicar cupón a una venta
export const applyCoupon = async (req, res) => {
  try {
    const { couponId, customerId, customerName, saleId, discountAmount } = req.body;
    
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    // Verificar validez
    if (!coupon.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Cupón no válido'
      });
    }
    
    // Verificar cliente si aplica
    if (customerId) {
      const customerCheck = coupon.canBeUsedByCustomer(customerId);
      if (!customerCheck.valid) {
        return res.status(400).json({
          success: false,
          message: customerCheck.reason
        });
      }
    }
    
    // Registrar uso
    await coupon.recordUsage(customerId, customerName, saleId, discountAmount);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: `Aplicó cupón ${coupon.code} en venta`,
      details: { 
        couponId: coupon._id,
        saleId,
        customerId,
        discountAmount
      },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      data: {
        currentUsage: coupon.currentUsage,
        remainingUses: coupon.maxUsage ? coupon.maxUsage - coupon.currentUsage : null
      }
    });
  } catch (error) {
    console.error('Error al aplicar cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar cupón',
      error: error.message
    });
  }
};

// Cambiar estado de cupón
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }
    
    const coupon = await Coupon.findById(id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    const oldStatus = coupon.status;
    coupon.status = status;
    await coupon.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'promotions',
      description: `Cambió estado del cupón ${coupon.code} de ${oldStatus} a ${status}`,
      details: { 
        couponId: coupon._id,
        oldStatus,
        newStatus: status
      },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: `Cupón ${status === 'active' ? 'activado' : 'desactivado'} exitosamente`,
      data: coupon
    });
  } catch (error) {
    console.error('Error al cambiar estado del cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del cupón',
      error: error.message
    });
  }
};

// Obtener estadísticas de uso de cupón
export const getCouponStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id)
      .populate('usageHistory.customerId', 'name phone');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
    }
    
    // Calcular estadísticas
    const totalDiscount = coupon.usageHistory.reduce((sum, usage) => 
      sum + usage.discountAmount, 0
    );
    
    const uniqueCustomers = new Set(
      coupon.usageHistory.map(usage => usage.customerId.toString())
    ).size;
    
    const avgDiscount = coupon.currentUsage > 0 ? 
      totalDiscount / coupon.currentUsage : 0;
    
    const stats = {
      code: coupon.code,
      currentUsage: coupon.currentUsage,
      maxUsage: coupon.maxUsage,
      remainingUses: coupon.maxUsage ? coupon.maxUsage - coupon.currentUsage : null,
      totalDiscountGiven: Math.round(totalDiscount * 100) / 100,
      averageDiscount: Math.round(avgDiscount * 100) / 100,
      uniqueCustomers,
      usageHistory: coupon.usageHistory.slice(-10), // Últimos 10 usos
      isValid: coupon.isValid
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del cupón',
      error: error.message
    });
  }
};

// Generar código aleatorio
export const generateCouponCode = async (req, res) => {
  try {
    const { length = 8, prefix = '' } = req.query;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix.toUpperCase();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Generar código aleatorio
      for (let i = code.length; i < parseInt(length); i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Verificar que no exista
      const existing = await Coupon.findOne({ code });
      if (!existing) {
        return res.json({
          success: true,
          code
        });
      }
      
      code = prefix.toUpperCase();
      attempts++;
    }
    
    res.status(400).json({
      success: false,
      message: 'No se pudo generar un código único'
    });
  } catch (error) {
    console.error('Error al generar código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código',
      error: error.message
    });
  }
};
