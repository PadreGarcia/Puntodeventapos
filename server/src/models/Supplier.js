import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  taxId: {
    type: String,
    required: true,
    trim: true
  },
  paymentTerms: {
    type: Number,
    default: 30
  },
  visitDays: [String],
  notes: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices
supplierSchema.index({ name: 'text' });
supplierSchema.index({ status: 1 });

export default mongoose.model('Supplier', supplierSchema);
