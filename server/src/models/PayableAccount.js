import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'check', 'card'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: String,
    required: true
  },
  processedByName: {
    type: String
  }
});

const payableAccountSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true
  },
  invoiceId: {
    type: String,
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
    index: true
  },
  paymentHistory: [paymentHistorySchema],
  notes: {
    type: String,
    trim: true
  },
  // Recordatorios
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices compuestos
payableAccountSchema.index({ supplierId: 1, status: 1 });
payableAccountSchema.index({ status: 1, dueDate: 1 });
payableAccountSchema.index({ dueDate: 1 });

// Virtual para días de retraso
payableAccountSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'overdue') {
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Actualizar monto pendiente y status antes de guardar
payableAccountSchema.pre('save', function(next) {
  this.amountDue = this.amount - this.amountPaid;
  
  // Actualizar status según pagos y fecha
  if (this.amountPaid === 0) {
    if (this.dueDate < new Date()) {
      this.status = 'overdue';
    } else {
      this.status = 'pending';
    }
  } else if (this.amountPaid >= this.amount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  next();
});

// Método para registrar un pago
payableAccountSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push(paymentData);
  this.amountPaid += paymentData.amount;
  this.amountDue = this.amount - this.amountPaid;
  
  // Actualizar status
  if (this.amountPaid >= this.amount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  return this.save();
};

// Configurar virtuals en JSON
payableAccountSchema.set('toJSON', { virtuals: true });
payableAccountSchema.set('toObject', { virtuals: true });

export default mongoose.model('PayableAccount', payableAccountSchema);
