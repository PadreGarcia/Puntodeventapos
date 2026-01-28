import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'pieza'
  },
  unitEquivalence: {
    type: Number
  },
  equivalenceUnit: {
    type: String
  },
  unitCost: {
    type: Number,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    min: 0,
    default: 0
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  items: [purchaseOrderItemSchema],
  subtotal: {
    type: Number,
    min: 0,
    default: 0
  },
  tax: {
    type: Number,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'pending', 'approved', 'received', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true
  },
  expectedDate: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  createdByName: {
    type: String
  },
  sentAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: String
  },
  receivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ supplierId: 1, status: 1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ createdAt: -1 });

// Generar número de orden automático
purchaseOrderSchema.statics.generateOrderNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `OC${year}${month}`;
  
  // Buscar última orden del mes
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}`)
  }).sort({ orderNumber: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
