import mongoose from 'mongoose';

const CouponUsageSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 4,
    maxlength: 20
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_shipping', 'free_product']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Restricciones
  minPurchaseAmount: {
    type: Number,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{
    type: String
  }],
  customerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  
  // Uso
  maxUsage: {
    type: Number,
    min: 1
  },
  maxUsagePerCustomer: {
    type: Number,
    min: 1,
    default: 1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  usageHistory: [CouponUsageSchema],
  
  // Vigencia
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ status: 1, startDate: 1, endDate: 1 });
CouponSchema.index({ customerIds: 1 });

// Virtual para verificar si el cupón está válido
CouponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.maxUsage || this.currentUsage < this.maxUsage);
});

// Método para verificar si un cliente puede usar el cupón
CouponSchema.methods.canBeUsedByCustomer = function(customerId) {
  // Verificar si está válido globalmente
  if (!this.isValid) {
    return { valid: false, reason: 'Cupón expirado o inactivo' };
  }
  
  // Verificar restricción de clientes específicos
  if (this.customerIds && this.customerIds.length > 0) {
    const customerIdStr = customerId.toString();
    const isAllowed = this.customerIds.some(id => id.toString() === customerIdStr);
    if (!isAllowed) {
      return { valid: false, reason: 'Este cupón no está disponible para ti' };
    }
  }
  
  // Verificar uso máximo por cliente
  if (this.maxUsagePerCustomer) {
    const customerIdStr = customerId.toString();
    const customerUsageCount = this.usageHistory.filter(
      usage => usage.customerId.toString() === customerIdStr
    ).length;
    
    if (customerUsageCount >= this.maxUsagePerCustomer) {
      return { valid: false, reason: 'Ya alcanzaste el límite de uso para este cupón' };
    }
  }
  
  return { valid: true };
};

// Método para calcular descuento
CouponSchema.methods.calculateDiscount = function(subtotal, applicableProducts = []) {
  let discount = 0;
  
  // Verificar monto mínimo de compra
  if (this.minPurchaseAmount && subtotal < this.minPurchaseAmount) {
    return 0;
  }
  
  switch (this.type) {
    case 'percentage':
      discount = subtotal * (this.value / 100);
      break;
    case 'fixed':
      discount = this.value;
      break;
    case 'free_product':
      // El valor representa el precio del producto gratis
      discount = this.value;
      break;
    case 'free_shipping':
      // Para este POS no aplica, pero dejamos la opción
      discount = 0;
      break;
  }
  
  // Aplicar descuento máximo si existe
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }
  
  // No puede ser mayor que el subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  return Math.round(discount * 100) / 100;
};

// Método para registrar uso
CouponSchema.methods.recordUsage = async function(customerId, customerName, saleId, discountAmount) {
  this.usageHistory.push({
    customerId,
    customerName,
    saleId,
    discountAmount,
    usedAt: new Date()
  });
  
  this.currentUsage += 1;
  
  // Auto-expirar si alcanzó el uso máximo
  if (this.maxUsage && this.currentUsage >= this.maxUsage) {
    this.status = 'expired';
  }
  
  return this.save();
};

// Middleware pre-save para actualizar status
CouponSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-expirar si pasó la fecha de fin
  if (this.status === 'active' && this.endDate < now) {
    this.status = 'expired';
  }
  
  next();
});

// Configurar toJSON para incluir virtuals
CouponSchema.set('toJSON', { virtuals: true });
CouponSchema.set('toObject', { virtuals: true });

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
