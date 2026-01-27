import Promotion from '../models/Promotion.js';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// CRUD DE PROMOCIONES
// ==========================================

// Obtener todas las promociones
export const getAllPromotions = async (req, res) => {
  try {
    const { status, type, active_only } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Filtro para obtener solo promociones activas y vigentes
    if (active_only === 'true') {
      const now = new Date();
      query.status = 'active';
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }
    
    const promotions = await Promotion.find(query)
      .populate('productIds', 'name price image category')
      .populate('freeProductIds', 'name price image')
      .populate('createdBy', 'username fullName')
      .sort({ priority: -1, createdAt: -1 });
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'view',
      module: 'promotions',
      description: `Consultó lista de promociones`,
      success: true,
      criticality: 'low'
    });
    
    res.json({
      success: true,
      count: promotions.length,
      data: promotions
    });
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
};

// Obtener promoción por ID
export const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('productIds', 'name price image category stock')
      .populate('freeProductIds', 'name price image')
      .populate('createdBy', 'username fullName');
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Error al obtener promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promoción',
      error: error.message
    });
  }
};

// Crear nueva promoción
export const createPromotion = async (req, res) => {
  try {
    const promotionData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Validar fechas
    if (new Date(promotionData.startDate) >= new Date(promotionData.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }
    
    // Validar que los productos existan
    if (promotionData.productIds && promotionData.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: promotionData.productIds } });
      if (products.length !== promotionData.productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más productos no existen'
        });
      }
    }
    
    const promotion = await Promotion.create(promotionData);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: `Creó promoción: ${promotion.name}`,
      details: { promotionId: promotion._id, type: promotion.type },
      success: true,
      criticality: 'medium'
    });
    
    const populatedPromotion = await Promotion.findById(promotion._id)
      .populate('productIds', 'name price image category')
      .populate('freeProductIds', 'name price image')
      .populate('createdBy', 'username fullName');
    
    res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: populatedPromotion
    });
  } catch (error) {
    console.error('Error al crear promoción:', error);
    
    // Registrar auditoría de falla
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: `Intento fallido de crear promoción`,
      details: { error: error.message },
      success: false,
      criticality: 'medium'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al crear promoción',
      error: error.message
    });
  }
};

// Actualizar promoción
export const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
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
    
    // Validar productos si se actualizan
    if (req.body.productIds && req.body.productIds.length > 0) {
      const products = await Product.find({ _id: { $in: req.body.productIds } });
      if (products.length !== req.body.productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más productos no existen'
        });
      }
    }
    
    const oldData = promotion.toObject();
    
    Object.assign(promotion, req.body);
    promotion.lastModified = new Date();
    
    await promotion.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'promotions',
      description: `Actualizó promoción: ${promotion.name}`,
      details: { 
        promotionId: promotion._id,
        changes: req.body,
        oldData: oldData
      },
      success: true,
      criticality: 'medium'
    });
    
    const updatedPromotion = await Promotion.findById(promotion._id)
      .populate('productIds', 'name price image category')
      .populate('freeProductIds', 'name price image')
      .populate('createdBy', 'username fullName');
    
    res.json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: updatedPromotion
    });
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar promoción',
      error: error.message
    });
  }
};

// Eliminar promoción
export const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }
    
    const promotionName = promotion.name;
    
    await Promotion.findByIdAndDelete(req.params.id);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'delete',
      module: 'promotions',
      description: `Eliminó promoción: ${promotionName}`,
      details: { 
        promotionId: req.params.id,
        promotionData: promotion.toObject()
      },
      success: true,
      criticality: 'high'
    });
    
    res.json({
      success: true,
      message: 'Promoción eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar promoción',
      error: error.message
    });
  }
};

// ==========================================
// OPERACIONES ESPECIALES
// ==========================================

// Cambiar estado de promoción (activar/desactivar)
export const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'scheduled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }
    
    const oldStatus = promotion.status;
    promotion.status = status;
    promotion.lastModified = new Date();
    
    await promotion.save();
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'edit',
      module: 'promotions',
      description: `Cambió estado de promoción "${promotion.name}" de ${oldStatus} a ${status}`,
      details: { 
        promotionId: promotion._id,
        oldStatus,
        newStatus: status
      },
      success: true,
      criticality: 'medium'
    });
    
    res.json({
      success: true,
      message: `Promoción ${status === 'active' ? 'activada' : status === 'inactive' ? 'desactivada' : 'programada'} exitosamente`,
      data: promotion
    });
  } catch (error) {
    console.error('Error al cambiar estado de promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de promoción',
      error: error.message
    });
  }
};

// Obtener promociones aplicables a un producto específico
export const getPromotionsForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();
    
    // Buscar producto
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Buscar promociones aplicables
    const promotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { productIds: productId },
        { categoryIds: product.category },
        { applyToAll: true }
      ]
    })
    .populate('productIds', 'name price image')
    .sort({ priority: -1 });
    
    // Filtrar por día y hora
    const validPromotions = promotions.filter(promo => promo.isValidNow());
    
    res.json({
      success: true,
      count: validPromotions.length,
      data: validPromotions
    });
  } catch (error) {
    console.error('Error al obtener promociones del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promociones del producto',
      error: error.message
    });
  }
};

// Obtener ofertas activas (vista de cliente)
export const getActiveDeals = async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('productIds', 'name price image category')
    .populate('freeProductIds', 'name price')
    .sort({ priority: -1 });
    
    // Filtrar por día y hora y crear vista simplificada
    const activeDeals = promotions
      .filter(promo => promo.isValidNow())
      .map(promo => ({
        promotionId: promo._id,
        name: promo.name,
        type: promo.type,
        description: promo.description,
        discountPreview: getDiscountPreview(promo),
        productsAffected: promo.productIds.length,
        endsAt: promo.endDate,
        imageUrl: promo.imageUrl,
        priority: promo.priority
      }));
    
    res.json({
      success: true,
      count: activeDeals.length,
      data: activeDeals
    });
  } catch (error) {
    console.error('Error al obtener ofertas activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ofertas activas',
      error: error.message
    });
  }
};

// Aplicar promoción a una venta (calcular descuentos)
export const applyPromotionToCart = async (req, res) => {
  try {
    const { promotionId, cartItems, customerId } = req.body;
    
    const promotion = await Promotion.findById(promotionId)
      .populate('productIds', 'price')
      .populate('freeProductIds', 'price');
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }
    
    // Verificar que la promoción esté activa
    if (!promotion.isValid || !promotion.isValidNow()) {
      return res.status(400).json({
        success: false,
        message: 'Esta promoción no está disponible en este momento'
      });
    }
    
    // Verificar restricciones de cliente
    if (customerId && promotion.excludeCustomerIds && 
        promotion.excludeCustomerIds.includes(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Esta promoción no está disponible para este cliente'
      });
    }
    
    // Calcular descuento según tipo de promoción
    const result = calculatePromotionDiscount(promotion, cartItems);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error al aplicar promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar promoción',
      error: error.message
    });
  }
};

// Duplicar promoción
export const duplicatePromotion = async (req, res) => {
  try {
    const originalPromotion = await Promotion.findById(req.params.id);
    
    if (!originalPromotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }
    
    // Crear copia
    const promotionData = originalPromotion.toObject();
    delete promotionData._id;
    delete promotionData.createdAt;
    delete promotionData.updatedAt;
    promotionData.name = `${promotionData.name} (Copia)`;
    promotionData.status = 'inactive';
    promotionData.currentUsage = 0;
    promotionData.createdBy = req.user._id;
    
    const newPromotion = await Promotion.create(promotionData);
    
    // Registrar auditoría
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      module: 'promotions',
      description: `Duplicó promoción: ${originalPromotion.name}`,
      details: { 
        originalId: originalPromotion._id,
        newId: newPromotion._id
      },
      success: true,
      criticality: 'low'
    });
    
    const populatedPromotion = await Promotion.findById(newPromotion._id)
      .populate('productIds', 'name price image')
      .populate('createdBy', 'username fullName');
    
    res.status(201).json({
      success: true,
      message: 'Promoción duplicada exitosamente',
      data: populatedPromotion
    });
  } catch (error) {
    console.error('Error al duplicar promoción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al duplicar promoción',
      error: error.message
    });
  }
};

// ==========================================
// FUNCIONES HELPER
// ==========================================

function getDiscountPreview(promotion) {
  switch (promotion.type) {
    case 'percentage_discount':
      return `${promotion.discountValue}% de descuento`;
    case 'fixed_discount':
      return `$${promotion.discountValue} de descuento`;
    case 'buy_x_get_y':
      return `${promotion.buyQuantity}x${promotion.getQuantity}`;
    case 'combo':
      return `Combo especial`;
    case 'volume_discount':
      return `Descuento por volumen`;
    case 'special_price':
      return `Precio especial $${promotion.specialPrice}`;
    case 'category_discount':
      return `Descuento en categoría`;
    case 'tier_discount':
      return `Descuento por nivel`;
    default:
      return 'Oferta especial';
  }
}

function calculatePromotionDiscount(promotion, cartItems) {
  let discount = 0;
  let applicableItems = [];
  
  // Calcular subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Verificar condiciones mínimas
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (promotion.minQuantity && totalQuantity < promotion.minQuantity) {
    return {
      applicable: false,
      reason: `Se requieren al menos ${promotion.minQuantity} productos`,
      discount: 0
    };
  }
  
  if (promotion.minAmount && subtotal < promotion.minAmount) {
    return {
      applicable: false,
      reason: `Compra mínima de $${promotion.minAmount}`,
      discount: 0
    };
  }
  
  // Filtrar items aplicables
  if (!promotion.applyToAll) {
    const productIds = promotion.productIds.map(id => id.toString());
    applicableItems = cartItems.filter(item => 
      productIds.includes(item.productId.toString()) ||
      (promotion.categoryIds && promotion.categoryIds.includes(item.category))
    );
  } else {
    applicableItems = cartItems;
  }
  
  if (applicableItems.length === 0) {
    return {
      applicable: false,
      reason: 'No hay productos aplicables en el carrito',
      discount: 0
    };
  }
  
  const applicableSubtotal = applicableItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  // Calcular descuento según tipo
  switch (promotion.type) {
    case 'percentage_discount':
      discount = applicableSubtotal * (promotion.discountValue / 100);
      break;
    case 'fixed_discount':
      discount = promotion.discountValue;
      break;
    case 'special_price':
      // Aplicar precio especial al primer producto aplicable
      if (applicableItems.length > 0) {
        const item = applicableItems[0];
        discount = (item.price - promotion.specialPrice) * item.quantity;
      }
      break;
    // Otros tipos requieren lógica más compleja...
  }
  
  return {
    applicable: true,
    discount: Math.round(discount * 100) / 100,
    applicableItems: applicableItems.length,
    description: getDiscountPreview(promotion)
  };
}
