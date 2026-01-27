import mongoose from 'mongoose';

const loanPaymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestAmount: {
    type: Number,
    required: true,
    min: 0
  },
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
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  paidDate: Date,
  paymentMethod: String,
  reference: String,
  receivedBy: String,
  receivedByName: String,
  notes: String
});

const loanSchema = new mongoose.Schema({
  loanNumber: {
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
  customerAddress: String,
  
  // Montos del préstamo
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // % mensual
  },
  termMonths: {
    type: Number,
    required: true,
    min: 1
  },
  totalInterest: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado del préstamo
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
  
  // Fechas
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Pagos programados
  payments: [loanPaymentSchema],
  
  // Garantías/Colateral
  collateral: {
    type: String
  },
  collateralValue: {
    type: Number,
    default: 0
  },
  
  // Información adicional
  purpose: String, // Propósito del préstamo
  approvedBy: {
    type: String,
    required: true
  },
  approvedByName: String,
  disbursedBy: String,
  disbursedByName: String,
  disbursementDate: Date,
  disbursementMethod: String, // cash, transfer, check
  
  // Penalizaciones
  lateFeePercentage: {
    type: Number,
    default: 5 // % sobre el pago atrasado
  },
  totalLateFees: {
    type: Number,
    default: 0
  },
  
  // Notas y observaciones
  notes: String,
  cancellationReason: String,
  
  // Documentos adjuntos (referencias a archivos)
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Índices
loanSchema.index({ loanNumber: 1 });
loanSchema.index({ customerId: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ startDate: -1 });

// Generar número de préstamo automático
loanSchema.statics.generateLoanNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `PREST-${year}${month}`;
  
  const lastLoan = await this.findOne({
    loanNumber: new RegExp(`^${prefix}`)
  }).sort({ loanNumber: -1 });
  
  let sequence = 1;
  if (lastLoan) {
    const lastSequence = parseInt(lastLoan.loanNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// Calcular préstamo con interés simple
loanSchema.statics.calculateLoan = function(principal, interestRate, termMonths) {
  // Interés simple: I = P * r * t
  const totalInterest = principal * (interestRate / 100) * termMonths;
  const totalAmount = principal + totalInterest;
  const monthlyPayment = totalAmount / termMonths;
  
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100
  };
};

// Generar tabla de amortización
loanSchema.methods.generatePaymentSchedule = function() {
  const payments = [];
  const principalPerPayment = this.loanAmount / this.termMonths;
  const interestPerPayment = this.totalInterest / this.termMonths;
  const monthlyAmount = this.monthlyPayment;
  
  for (let i = 1; i <= this.termMonths; i++) {
    const dueDate = new Date(this.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    payments.push({
      paymentNumber: i,
      dueDate,
      principalAmount: Math.round(principalPerPayment * 100) / 100,
      interestAmount: Math.round(interestPerPayment * 100) / 100,
      totalAmount: monthlyAmount,
      remainingAmount: monthlyAmount,
      status: 'pending'
    });
  }
  
  this.payments = payments;
  return this;
};

// Registrar pago de una cuota
loanSchema.methods.recordPayment = function(paymentNumber, paymentData) {
  const payment = this.payments.find(p => p.paymentNumber === paymentNumber);
  
  if (!payment) {
    throw new Error('Pago no encontrado');
  }
  
  if (payment.status === 'paid') {
    throw new Error('Este pago ya está completado');
  }
  
  // Registrar el pago
  payment.paidAmount += paymentData.amount;
  payment.remainingAmount = payment.totalAmount - payment.paidAmount;
  payment.paymentMethod = paymentData.paymentMethod;
  payment.reference = paymentData.reference;
  payment.receivedBy = paymentData.receivedBy;
  payment.receivedByName = paymentData.receivedByName;
  payment.notes = paymentData.notes;
  
  // Actualizar estado del pago
  if (payment.remainingAmount <= 0) {
    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.remainingAmount = 0;
  } else if (payment.paidAmount > 0) {
    payment.status = 'partial';
  }
  
  // Actualizar totales del préstamo
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.paidAmount, 0);
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Verificar si el préstamo está completado
  const allPaid = this.payments.every(p => p.status === 'paid');
  if (allPaid) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Verificar pagos vencidos y aplicar penalizaciones
loanSchema.methods.checkOverduePayments = function() {
  const today = new Date();
  let totalLateFees = 0;
  
  this.payments.forEach(payment => {
    if (payment.status !== 'paid' && today > payment.dueDate) {
      payment.status = 'overdue';
      
      // Calcular días de atraso
      const daysLate = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24));
      if (daysLate > 0) {
        const lateFee = payment.totalAmount * (this.lateFeePercentage / 100);
        totalLateFees += lateFee;
      }
    }
  });
  
  this.totalLateFees = Math.round(totalLateFees * 100) / 100;
  
  // Si hay pagos vencidos, marcar préstamo en mora
  const hasOverdue = this.payments.some(p => p.status === 'overdue');
  if (hasOverdue && this.status === 'active') {
    this.status = 'defaulted';
  }
  
  return this;
};

// Obtener próximo pago pendiente
loanSchema.methods.getNextPayment = function() {
  return this.payments.find(p => p.status === 'pending' || p.status === 'partial');
};

// Obtener resumen del préstamo
loanSchema.methods.getSummary = function() {
  const paidPayments = this.payments.filter(p => p.status === 'paid').length;
  const overduePayments = this.payments.filter(p => p.status === 'overdue').length;
  const nextPayment = this.getNextPayment();
  
  return {
    loanNumber: this.loanNumber,
    customerName: this.customerName,
    loanAmount: this.loanAmount,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    remainingAmount: this.remainingAmount,
    totalPayments: this.termMonths,
    paidPayments,
    pendingPayments: this.termMonths - paidPayments,
    overduePayments,
    nextPayment: nextPayment ? {
      paymentNumber: nextPayment.paymentNumber,
      dueDate: nextPayment.dueDate,
      amount: nextPayment.totalAmount,
      remainingAmount: nextPayment.remainingAmount
    } : null,
    status: this.status,
    lateFees: this.totalLateFees
  };
};

export default mongoose.model('Loan', loanSchema);
