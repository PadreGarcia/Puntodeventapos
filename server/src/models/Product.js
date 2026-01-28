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
  sku: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
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
    default: 5,
    min: 0
  },
  maxStock: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    default: 'pza',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierId: {
    type: String
  },
  supplierName: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Índices para búsqueda rápida
productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1 });

export default mongoose.model('Product', productSchema);
