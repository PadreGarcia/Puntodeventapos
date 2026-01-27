import mongoose from 'mongoose';

const nfcTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['activation', 'deactivation', 'linked', 'unlinked', 'purchase', 'points_earned', 'points_redeemed', 'tier_upgrade'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  performedBy: String,
  performedByName: String,
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  notes: String
});

const nfcCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  cardNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Vinculación con cliente
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  customerName: String,
  linkedAt: Date,
  linkedBy: String,
  linkedByName: String,
  
  // Estado de la tarjeta
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'lost', 'damaged'],
    default: 'inactive',
    index: true
  },
  
  // Tipo de tarjeta
  cardType: {
    type: String,
    enum: ['standard', 'premium', 'vip'],
    default: 'standard'
  },
  
  // Fechas
  issuedDate: {
    type: Date,
    default: Date.now
  },
  activatedDate: Date,
  expirationDate: Date,
  lastUsedDate: Date,
  
  // Uso
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTransactions: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Historial de transacciones
  transactions: [nfcTransactionSchema],
  
  // Notas administrativas
  notes: String,
  blockedReason: String,
  blockedBy: String,
  blockedByName: String,
  blockedAt: Date
}, {
  timestamps: true
});

// Índices
nfcCardSchema.index({ cardId: 1 });
nfcCardSchema.index({ customerId: 1 });
nfcCardSchema.index({ status: 1 });
nfcCardSchema.index({ cardNumber: 1 });

// Generar número de tarjeta automático
nfcCardSchema.statics.generateCardNumber = async function() {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `NFC${year}${month}`;
  
  const lastCard = await this.findOne({
    cardNumber: new RegExp(`^${prefix}`)
  }).sort({ cardNumber: -1 });
  
  let sequence = 1;
  if (lastCard) {
    const lastSequence = parseInt(lastCard.cardNumber.slice(-6));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(6, '0')}`;
};

// Validar formato de cardId (UID de NFC)
nfcCardSchema.statics.validateCardId = function(cardId) {
  // Formato esperado: 8 caracteres hexadecimales (ej: AB12CD34)
  const regex = /^[A-F0-9]{8}$/;
  return regex.test(cardId.toUpperCase());
};

// Método para vincular tarjeta con cliente
nfcCardSchema.methods.linkToCustomer = function(customerId, customerName, userId, userName) {
  if (this.customerId) {
    throw new Error('La tarjeta ya está vinculada a un cliente');
  }
  
  if (this.status === 'blocked' || this.status === 'lost' || this.status === 'damaged') {
    throw new Error('No se puede vincular una tarjeta bloqueada, perdida o dañada');
  }
  
  this.customerId = customerId;
  this.customerName = customerName;
  this.linkedAt = new Date();
  this.linkedBy = userId;
  this.linkedByName = userName;
  this.status = 'active';
  
  if (!this.activatedDate) {
    this.activatedDate = new Date();
  }
  
  this.transactions.push({
    transactionType: 'linked',
    performedBy: userId,
    performedByName: userName,
    details: {
      customerId,
      customerName
    }
  });
  
  return this.save();
};

// Método para desvincular tarjeta
nfcCardSchema.methods.unlinkFromCustomer = function(userId, userName, reason) {
  if (!this.customerId) {
    throw new Error('La tarjeta no está vinculada a ningún cliente');
  }
  
  const previousCustomerId = this.customerId;
  const previousCustomerName = this.customerName;
  
  this.transactions.push({
    transactionType: 'unlinked',
    performedBy: userId,
    performedByName: userName,
    details: {
      previousCustomerId,
      previousCustomerName,
      reason
    },
    notes: reason
  });
  
  this.customerId = null;
  this.customerName = null;
  this.linkedAt = null;
  this.linkedBy = null;
  this.linkedByName = null;
  this.status = 'inactive';
  
  return this.save();
};

// Método para activar tarjeta
nfcCardSchema.methods.activate = function(userId, userName) {
  if (this.status === 'active') {
    throw new Error('La tarjeta ya está activa');
  }
  
  if (this.status === 'lost' || this.status === 'damaged') {
    throw new Error('No se puede activar una tarjeta perdida o dañada');
  }
  
  this.status = 'active';
  this.activatedDate = new Date();
  
  this.transactions.push({
    transactionType: 'activation',
    performedBy: userId,
    performedByName: userName
  });
  
  return this.save();
};

// Método para bloquear tarjeta
nfcCardSchema.methods.block = function(userId, userName, reason) {
  this.status = 'blocked';
  this.blockedBy = userId;
  this.blockedByName = userName;
  this.blockedAt = new Date();
  this.blockedReason = reason;
  
  this.transactions.push({
    transactionType: 'deactivation',
    performedBy: userId,
    performedByName: userName,
    notes: reason
  });
  
  return this.save();
};

// Método para registrar uso
nfcCardSchema.methods.recordUsage = function(transactionType, details) {
  this.usageCount += 1;
  this.lastUsedDate = new Date();
  
  if (transactionType === 'purchase') {
    this.totalTransactions += 1;
  }
  
  this.transactions.push({
    transactionType,
    details
  });
  
  return this.save();
};

// Método para verificar si está activa y vinculada
nfcCardSchema.methods.isActiveAndLinked = function() {
  return this.status === 'active' && this.customerId != null;
};

export default mongoose.model('NFCCard', nfcCardSchema);
