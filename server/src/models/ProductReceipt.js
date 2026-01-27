import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantityOrdered: {
    type: Number,
    required: true,
    min: 0
  },
  quantityReceived: {
    type: Number,
    required: true,
    min: 0
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
});

const productReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  purchaseOrderId: {
    type: String,
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  supplierId: {
    type: String,
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true
  },
  items: [receiptItemSchema],
  receivedDate: {
    type: Date,
    default: Date.now
  },
  receivedBy: {
    type: String,
    required: true
  },
  receivedByName: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['partial', 'complete'],
    default: 'complete'
  },
  discrepancies: [{
    productId: String,
    productName: String,
    expected: Number,
    received: Number,
    difference: Number,
    reason: String
  }]
}, {
  timestamps: true
});

// Índices
productReceiptSchema.index({ receiptNumber: 1 });
productReceiptSchema.index({ purchaseOrderId: 1 });
productReceiptSchema.index({ supplierId: 1, receivedDate: -1 });
productReceiptSchema.index({ receivedDate: -1 });

// Generar número de recepción automático
productReceiptSchema.statics.generateReceiptNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `RC${year}${month}`;
  
  const lastReceipt = await this.findOne({
    receiptNumber: new RegExp(`^${prefix}`)
  }).sort({ receiptNumber: -1 });
  
  let sequence = 1;
  if (lastReceipt) {
    const lastSequence = parseInt(lastReceipt.receiptNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export default mongoose.model('ProductReceipt', productReceiptSchema);
