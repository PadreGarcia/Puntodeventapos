import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
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
  }
});

const supplierInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
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
  receiptId: {
    type: String,
    index: true
  },
  receiptNumber: {
    type: String
  },
  purchaseOrderId: {
    type: String,
    index: true
  },
  orderNumber: {
    type: String
  },
  items: [invoiceItemSchema],
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
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paymentTerms: {
    type: Number,
    default: 30 // días
  },
  notes: {
    type: String,
    trim: true
  },
  // Archivo digital de la factura
  attachmentUrl: {
    type: String
  },
  // Información fiscal
  taxId: {
    type: String
  },
  // Tracking de pagos
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountDue: {
    type: Number,
    min: 0
  },
  // Usuario que registró la factura
  createdBy: {
    type: String,
    required: true
  },
  createdByName: {
    type: String
  }
}, {
  timestamps: true
});

// Índices
supplierInvoiceSchema.index({ invoiceNumber: 1 });
supplierInvoiceSchema.index({ supplierId: 1, status: 1 });
supplierInvoiceSchema.index({ status: 1, dueDate: 1 });
supplierInvoiceSchema.index({ dueDate: 1 });
supplierInvoiceSchema.index({ invoiceDate: -1 });

// Calcular monto pendiente antes de guardar
supplierInvoiceSchema.pre('save', function(next) {
  this.amountDue = this.total - this.amountPaid;
  
  // Actualizar status según pagos
  if (this.amountPaid === 0) {
    // Verificar si está vencida
    if (this.dueDate < new Date() && this.status === 'pending') {
      this.status = 'overdue';
    }
  } else if (this.amountPaid >= this.total) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  next();
});

export default mongoose.model('SupplierInvoice', supplierInvoiceSchema);
