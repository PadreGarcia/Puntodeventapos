import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String
  }
}, {
  timestamps: true
});

// Índices para búsqueda rápida
productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1 });

export default mongoose.model('Product', productSchema);
