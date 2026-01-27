import mongoose from 'mongoose';

const RechargeCarrierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  color: {
    type: String,
    required: true
  },
  logo: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  commissionRate: {
    type: Number,
    default: 0.05, // 5%
    min: 0,
    max: 1
  },
  supportedProductTypes: [{
    type: String,
    enum: ['airtime', 'data', 'social', 'unlimited']
  }],
  apiConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    endpoint: String,
    apiKey: String
  }
}, {
  timestamps: true
});

// Índices
RechargeCarrierSchema.index({ code: 1 });
RechargeCarrierSchema.index({ active: 1 });

const RechargeCarrier = mongoose.model('RechargeCarrier', RechargeCarrierSchema);
export default RechargeCarrier;
