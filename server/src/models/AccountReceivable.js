import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'check'],
    required: true
  },
  reference: String,
  receivedBy: {
    type: String,
    required: true
  },
  receivedByName: String,
  notes: String
});

const accountReceivableSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: String,
  
  // Detalles de la venta original
  saleId: {
    type: String,
    index: true
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Montos
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Términos de pago
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  paymentTermDays: {
    type: Number,
    default: 30
  },
  
  // Estado
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Pagos realizados
  payments: [paymentHistorySchema],
  
  // Intereses por mora
  interestRate: {
    type: Number,
    default: 0, // % mensual
    min: 0
  },
  accruedInterest: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Control
  createdBy: {
    type: String,
    required: true
  },
  createdByName: String,
  lastPaymentDate: Date,
  
  // Notas
  notes: String,
  cancellationReason: String
}, {
  timestamps: true
});

// Índices
accountReceivableSchema.index({ invoiceNumber: 1 });
accountReceivableSchema.index({ customerId: 1, status: 1 });
accountReceivableSchema.index({ status: 1, dueDate: 1 });
accountReceivableSchema.index({ saleDate: -1 });

// Generar número de factura automático
accountReceivableSchema.statics.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `FIADO-${year}${month}`;
  
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^${prefix}`)
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// Método para registrar pago
accountReceivableSchema.methods.recordPayment = function(payment) {
  this.payments.push({
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    reference: payment.reference,
    receivedBy: payment.receivedBy,
    receivedByName: payment.receivedByName,
    notes: payment.notes,
    paymentDate: new Date()
  });
  
  this.paidAmount += payment.amount;
  this.remainingAmount = this.totalAmount + this.accruedInterest - this.paidAmount;
  this.lastPaymentDate = new Date();
  
  // Actualizar status
  if (this.remainingAmount <= 0) {
    this.status = 'paid';
    this.remainingAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  }
  
  return this.save();
};

// Método para calcular intereses por mora
accountReceivableSchema.methods.calculateInterest = function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today <= dueDate || this.interestRate === 0) {
    return 0;
  }
  
  // Días de mora
  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  const monthsOverdue = daysOverdue / 30;
  
  // Interés simple sobre el saldo pendiente
  const interest = this.remainingAmount * (this.interestRate / 100) * monthsOverdue;
  this.accruedInterest = Math.round(interest * 100) / 100;
  
  return this.accruedInterest;
};

// Actualizar status a vencido automáticamente
accountReceivableSchema.methods.checkOverdue = function() {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today > dueDate && this.status !== 'paid' && this.status !== 'cancelled') {
    this.status = 'overdue';
  }
  
  return this;
};

// Hook pre-save para validar montos
accountReceivableSchema.pre('save', function(next) {
  // Asegurar que remainingAmount no sea negativo
  if (this.remainingAmount < 0) {
    this.remainingAmount = 0;
  }
  
  next();
});

export default mongoose.model('AccountReceivable', accountReceivableSchema);
