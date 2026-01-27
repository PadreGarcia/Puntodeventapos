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

const cashCountSchema = new mongoose.Schema({
  countNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shiftId: {
    type: String,
    required: true,
    index: true
  },
  shiftNumber: {
    type: String,
    required: true
  },
  countedBy: {
    type: String,
    required: true,
    index: true
  },
  countedByName: {
    type: String,
    required: true
  },
  countedAt: {
    type: Date,
    default: Date.now
  },
  // Denominaciones contadas
  denominations: [cashDenominationSchema],
  // Totales
  totalCounted: {
    type: Number,
    required: true,
    min: 0
  },
  expectedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  difference: {
    type: Number,
    default: 0
  },
  // Desglose
  totalBills: {
    type: Number,
    default: 0
  },
  totalCoins: {
    type: Number,
    default: 0
  },
  // Tipo de arqueo
  type: {
    type: String,
    enum: ['regular', 'surprise', 'closing'],
    default: 'regular'
  },
  // Notas y observaciones
  notes: {
    type: String,
    trim: true
  },
  discrepancyReason: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String
  },
  approvedByName: {
    type: String
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
cashCountSchema.index({ countNumber: 1 });
cashCountSchema.index({ shiftId: 1, countedAt: -1 });
cashCountSchema.index({ countedBy: 1, countedAt: -1 });
cashCountSchema.index({ status: 1 });

// Generar número de arqueo automático
cashCountSchema.statics.generateCountNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const prefix = `ARQ${year}${month}${day}`;
  
  const lastCount = await this.findOne({
    countNumber: new RegExp(`^${prefix}`)
  }).sort({ countNumber: -1 });
  
  let sequence = 1;
  if (lastCount) {
    const lastSequence = parseInt(lastCount.countNumber.slice(-3));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

// Calcular totales antes de guardar
cashCountSchema.pre('save', function(next) {
  // Calcular diferencia
  this.difference = this.totalCounted - this.expectedAmount;
  
  // Separar billetes de monedas
  this.totalBills = 0;
  this.totalCoins = 0;
  
  this.denominations.forEach(denom => {
    if (denom.value >= 20) {
      this.totalBills += denom.total;
    } else {
      this.totalCoins += denom.total;
    }
  });
  
  next();
});

export default mongoose.model('CashCount', cashCountSchema);
