import mongoose from 'mongoose';

const ServicePaymentSchema = new mongoose.Schema({
  // Proveedor
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['energy', 'telecom', 'water_gas', 'government', 'entertainment', 'financial']
  },
  
  // Información del servicio
  reference: {
    type: String,
    required: true,
    trim: true
  },
  accountName: {
    type: String,
    trim: true
  },
  
  // Cliente
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerPhone: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Montos
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Pago
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'transfer', 'nfc']
  },
  receivedAmount: {
    type: Number,
    min: 0
  },
  changeGiven: {
    type: Number,
    min: 0
  },
  
  // Estado
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Confirmación
  confirmationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  externalTransactionId: {
    type: String // ID del proveedor externo
  },
  
  // Usuario que procesó
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operatorName: {
    type: String,
    required: true
  },
  
  // Caja
  cashRegister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashRegister'
  },
  shift: {
    type: String
  },
  
  // Notas
  notes: {
    type: String
  },
  
  // Auditoría
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  
  // Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Índices
ServicePaymentSchema.index({ reference: 1, provider: 1 });
ServicePaymentSchema.index({ confirmationCode: 1 }, { unique: true });
ServicePaymentSchema.index({ status: 1, createdAt: -1 });
ServicePaymentSchema.index({ provider: 1, createdAt: -1 });
ServicePaymentSchema.index({ processedBy: 1, createdAt: -1 });
ServicePaymentSchema.index({ customerId: 1, createdAt: -1 });
ServicePaymentSchema.index({ category: 1, createdAt: -1 });
ServicePaymentSchema.index({ createdAt: -1 });

// Virtual para verificar si fue exitoso
ServicePaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Método estático para generar código de confirmación
ServicePaymentSchema.statics.generateConfirmationCode = async function() {
  let code;
  let exists = true;
  
  while (exists) {
    const prefix = 'SVC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `${prefix}${timestamp}${random}`.toUpperCase();
    
    exists = await this.findOne({ confirmationCode: code });
  }
  
  return code;
};

// Método para completar pago
ServicePaymentSchema.methods.complete = async function(externalTransactionId = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (externalTransactionId) {
    this.externalTransactionId = externalTransactionId;
  }
  return this.save();
};

// Método para marcar como fallido
ServicePaymentSchema.methods.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Método para cancelar
ServicePaymentSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\nCancelado: ${reason}` : `Cancelado: ${reason}`;
  return this.save();
};

// Método para reembolsar
ServicePaymentSchema.methods.refund = async function(reason) {
  this.status = 'refunded';
  this.notes = this.notes ? `${this.notes}\nReembolsado: ${reason}` : `Reembolsado: ${reason}`;
  return this.save();
};

// Middleware pre-save
ServicePaymentSchema.pre('save', function(next) {
  // Auto-completar fecha si está completado
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Configurar toJSON para incluir virtuals
ServicePaymentSchema.set('toJSON', { virtuals: true });
ServicePaymentSchema.set('toObject', { virtuals: true });

const ServicePayment = mongoose.model('ServicePayment', ServicePaymentSchema);
export default ServicePayment;
