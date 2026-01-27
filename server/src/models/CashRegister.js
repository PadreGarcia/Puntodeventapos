import mongoose from 'mongoose';

const cashDenominationSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  }
});

const cashMovementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['expense', 'income', 'transfer', 'other'],
    required: true
  },
  authorizedBy: {
    type: String,
    required: true
  },
  authorizedByName: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
});

const cashRegisterSchema = new mongoose.Schema({
  shiftNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  // Apertura
  openedBy: {
    type: String,
    required: true,
    index: true
  },
  openedByName: {
    type: String,
    required: true
  },
  openedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  openingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  openingDenominations: [cashDenominationSchema],
  openingNotes: {
    type: String,
    trim: true
  },
  // Cierre
  closedBy: {
    type: String
  },
  closedByName: {
    type: String
  },
  closedAt: {
    type: Date
  },
  expectedClosingBalance: {
    type: Number,
    default: 0
  },
  actualClosingBalance: {
    type: Number
  },
  closingDenominations: [cashDenominationSchema],
  difference: {
    type: Number,
    default: 0
  },
  closingNotes: {
    type: String,
    trim: true
  },
  // Movimientos de efectivo
  movements: [cashMovementSchema],
  // Resumen de ventas
  salesCount: {
    type: Number,
    default: 0
  },
  salesCash: {
    type: Number,
    default: 0
  },
  salesCard: {
    type: Number,
    default: 0
  },
  salesTransfer: {
    type: Number,
    default: 0
  },
  salesTotal: {
    type: Number,
    default: 0
  },
  // Resumen de movimientos
  totalIncome: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  // Calculado
  duration: {
    type: Number, // minutos
    default: 0
  }
}, {
  timestamps: true
});

// Índices
cashRegisterSchema.index({ shiftNumber: 1 });
cashRegisterSchema.index({ openedBy: 1, openedAt: -1 });
cashRegisterSchema.index({ status: 1, openedAt: -1 });
cashRegisterSchema.index({ openedAt: -1 });

// Generar número de turno automático
cashRegisterSchema.statics.generateShiftNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const prefix = `T${year}${month}${day}`;
  
  // Buscar último turno del día
  const lastShift = await this.findOne({
    shiftNumber: new RegExp(`^${prefix}`)
  }).sort({ shiftNumber: -1 });
  
  let sequence = 1;
  if (lastShift) {
    const lastSequence = parseInt(lastShift.shiftNumber.slice(-3));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

// Método para agregar movimiento
cashRegisterSchema.methods.addMovement = function(movement) {
  this.movements.push(movement);
  
  if (movement.type === 'income') {
    this.totalIncome += movement.amount;
  } else {
    this.totalWithdrawals += movement.amount;
  }
  
  // Recalcular balance esperado
  this.calculateExpectedBalance();
  
  return this.save();
};

// Método para calcular balance esperado
cashRegisterSchema.methods.calculateExpectedBalance = function() {
  this.expectedClosingBalance = 
    this.openingBalance +
    this.salesCash +
    this.totalIncome -
    this.totalWithdrawals;
  
  return this.expectedClosingBalance;
};

// Método para cerrar caja
cashRegisterSchema.methods.closeCashRegister = function(closingData) {
  this.status = 'closed';
  this.closedBy = closingData.closedBy;
  this.closedByName = closingData.closedByName;
  this.closedAt = new Date();
  this.actualClosingBalance = closingData.actualClosingBalance;
  this.closingDenominations = closingData.denominations || [];
  this.closingNotes = closingData.notes;
  
  // Calcular diferencia
  this.difference = this.actualClosingBalance - this.expectedClosingBalance;
  
  // Calcular duración en minutos
  const duration = (this.closedAt - this.openedAt) / (1000 * 60);
  this.duration = Math.round(duration);
  
  return this.save();
};

// Actualizar totales de ventas antes de guardar
cashRegisterSchema.pre('save', function(next) {
  if (this.isModified('salesCash') || this.isModified('salesCard') || this.isModified('salesTransfer')) {
    this.salesTotal = this.salesCash + this.salesCard + this.salesTransfer;
    this.calculateExpectedBalance();
  }
  next();
});

export default mongoose.model('CashRegister', cashRegisterSchema);
