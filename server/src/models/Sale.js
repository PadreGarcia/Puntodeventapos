import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    id: String,
    name: String,
    barcode: String,
    price: Number,
    cost: Number,
    image: String,
    category: String,
    stock: Number
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'nfc'],
    required: true
  },
  amountReceived: Number,
  change: Number,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  nfcCardId: String,
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
saleSchema.index({ date: -1 });
saleSchema.index({ customerId: 1 });
saleSchema.index({ paymentMethod: 1 });

export default mongoose.model('Sale', saleSchema);
