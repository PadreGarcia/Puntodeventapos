import mongoose from 'mongoose';

const customerReferenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  address: String
}, { _id: true });

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // Datos de identificación
  rfc: String,
  curp: String,
  ine: String,
  dateOfBirth: Date,
  
  // Dirección completa
  street: String,
  neighborhood: String,
  city: String,
  state: String,
  zipCode: String,
  
  // Referencias personales
  references: [customerReferenceSchema],
  
  // Sistema NFC y Lealtad
  nfcCardId: {
    type: String,
    unique: true,
    sparse: true
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Crédito
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  currentCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditScore: {
    type: Number,
    default: 650,
    min: 300,
    max: 850
  },
  
  // Historial
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchase: Date,
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  notes: String
}, {
  timestamps: true
});

// Índices
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ nfcCardId: 1 });
customerSchema.index({ loyaltyTier: 1 });

export default mongoose.model('Customer', customerSchema);
