import mongoose from 'mongoose';

const PhoneRechargeSchema = new mongoose.Schema({
  // Información del operador
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RechargeCarrier',
    required: true
  },
  carrierName: {
    type: String,
    required: true
  },
  
  // Información del cliente
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String
  },
  
  // Producto recargado
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RechargeProduct',
    required: true
  },
  productType: {
    type: String,
    required: true,
    enum: ['airtime', 'data', 'social', 'unlimited']
  },
  productName: {
    type: String,
    required: true
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
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
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
  
  // Estado de la recarga
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
  
  // Auditoría
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  notes: {
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
PhoneRechargeSchema.index({ phoneNumber: 1 });
PhoneRechargeSchema.index({ confirmationCode: 1 }, { unique: true });
PhoneRechargeSchema.index({ status: 1, createdAt: -1 });
PhoneRechargeSchema.index({ carrier: 1, createdAt: -1 });
PhoneRechargeSchema.index({ processedBy: 1, createdAt: -1 });
PhoneRechargeSchema.index({ customerId: 1, createdAt: -1 });
PhoneRechargeSchema.index({ createdAt: -1 });

// Virtual para verificar si fue exitosa
PhoneRechargeSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Método para generar código de confirmación
PhoneRechargeSchema.statics.generateConfirmationCode = async function(carrierCode) {
  let code;
  let exists = true;
  
  while (exists) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    code = `${carrierCode}-${timestamp}${random}`.toUpperCase();
    
    exists = await this.findOne({ confirmationCode: code });
  }
  
  return code;
};

// Método para completar recarga
PhoneRechargeSchema.methods.complete = async function(externalTransactionId = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (externalTransactionId) {
    this.externalTransactionId = externalTransactionId;
  }
  return this.save();
};

// Método para marcar como fallida
PhoneRechargeSchema.methods.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Método para cancelar
PhoneRechargeSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.notes = reason;
  return this.save();
};

// Método para reembolsar
PhoneRechargeSchema.methods.refund = async function(reason) {
  this.status = 'refunded';
  this.notes = reason;
  return this.save();
};

// Middleware pre-save
PhoneRechargeSchema.pre('save', function(next) {
  // Auto-completar si no tiene fecha de completado y está completo
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Configurar toJSON para incluir virtuals
PhoneRechargeSchema.set('toJSON', { virtuals: true });
PhoneRechargeSchema.set('toObject', { virtuals: true });

const PhoneRecharge = mongoose.model('PhoneRecharge', PhoneRechargeSchema);
export default PhoneRecharge;
