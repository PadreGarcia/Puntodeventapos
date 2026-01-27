import mongoose from 'mongoose';

const ComboProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  optional: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const PromotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'percentage_discount',
      'fixed_discount',
      'buy_x_get_y',
      'combo',
      'volume_discount',
      'special_price',
      'category_discount',
      'tier_discount'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'scheduled', 'expired'],
    default: 'inactive'
  },
  priority: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Productos aplicables
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  freeProductIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{
    type: String
  }],
  applyToAll: {
    type: Boolean,
    default: false
  },
  
  // Condiciones
  minQuantity: {
    type: Number,
    min: 0
  },
  minAmount: {
    type: Number,
    min: 0
  },
  maxUsagePerCustomer: {
    type: Number,
    min: 1
  },
  requiresCoupon: {
    type: Boolean,
    default: false
  },
  couponCode: {
    type: String,
    trim: true
  },
  
  // Beneficio
  discountType: {
    type: String,
    enum: ['percentage', 'fixed']
  },
  discountValue: {
    type: Number,
    min: 0
  },
  buyQuantity: {
    type: Number,
    min: 1
  },
  getQuantity: {
    type: Number,
    min: 1
  },
  specialPrice: {
    type: Number,
    min: 0
  },
  comboProducts: [ComboProductSchema],
  
  // Restricciones
  customerTiers: [{
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum']
  }],
  excludeCustomerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  maxTotalUsage: {
    type: Number,
    min: 1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Vigencia
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  timeStart: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  timeEnd: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para mejorar performance
PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ type: 1, status: 1 });
PromotionSchema.index({ productIds: 1 });
PromotionSchema.index({ categoryIds: 1 });
PromotionSchema.index({ priority: -1 });

// Virtual para verificar si la promoción está activa en este momento
PromotionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.maxTotalUsage || this.currentUsage < this.maxTotalUsage);
});

// Método para verificar si la promoción aplica en el día/hora actual
PromotionSchema.methods.isValidNow = function() {
  const now = new Date();
  
  // Verificar fechas
  if (now < this.startDate || now > this.endDate) {
    return false;
  }
  
  // Verificar día de la semana
  if (this.daysOfWeek && this.daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    if (!this.daysOfWeek.includes(currentDay)) {
      return false;
    }
  }
  
  // Verificar hora
  if (this.timeStart && this.timeEnd) {
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (currentTime < this.timeStart || currentTime > this.timeEnd) {
      return false;
    }
  }
  
  return true;
};

// Método para incrementar uso
PromotionSchema.methods.incrementUsage = async function() {
  this.currentUsage += 1;
  
  // Verificar si debe expirar por uso máximo
  if (this.maxTotalUsage && this.currentUsage >= this.maxTotalUsage) {
    this.status = 'expired';
  }
  
  return this.save();
};

// Middleware pre-save para actualizar status
PromotionSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-activar si está scheduled y ya comenzó
  if (this.status === 'scheduled' && this.startDate <= now && this.endDate >= now) {
    this.status = 'active';
  }
  
  // Auto-expirar si pasó la fecha de fin
  if (this.status === 'active' && this.endDate < now) {
    this.status = 'expired';
  }
  
  this.lastModified = now;
  next();
});

// Configurar toJSON para incluir virtuals
PromotionSchema.set('toJSON', { virtuals: true });
PromotionSchema.set('toObject', { virtuals: true });

const Promotion = mongoose.model('Promotion', PromotionSchema);
export default Promotion;
