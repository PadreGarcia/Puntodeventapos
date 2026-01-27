import mongoose from 'mongoose';

const RechargeProductSchema = new mongoose.Schema({
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RechargeCarrier',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['airtime', 'data', 'social', 'unlimited']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  validity: {
    type: String, // "7 días", "30 días", etc.
    trim: true
  },
  dataAmount: {
    type: String // "1 GB", "5 GB", etc.
  },
  active: {
    type: Boolean,
    default: true
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  metadata: {
    benefits: [String],
    restrictions: [String]
  }
}, {
  timestamps: true
});

// Índices
RechargeProductSchema.index({ carrier: 1, type: 1 });
RechargeProductSchema.index({ type: 1, active: 1 });
RechargeProductSchema.index({ sku: 1 }, { unique: true });
RechargeProductSchema.index({ price: 1 });

const RechargeProduct = mongoose.model('RechargeProduct', RechargeProductSchema);
export default RechargeProduct;
