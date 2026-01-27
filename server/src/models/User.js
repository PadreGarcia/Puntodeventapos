import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true
  },
  canView: { type: Boolean, default: false },
  canCreate: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Rol y permisos
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'cashier'],
    required: true,
    default: 'cashier'
  },
  permissions: [permissionSchema],
  
  // Estado
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Información adicional
  avatar: {
    type: String
  },
  employeeCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Información laboral
  hireDate: {
    type: Date
  },
  department: {
    type: String,
    enum: ['sales', 'administration', 'management', 'warehouse'],
    default: 'sales'
  },
  salary: {
    type: Number,
    min: 0
  },
  
  // Turnos y horarios
  workSchedule: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  
  // Sesión
  lastLogin: {
    type: Date
  },
  lastLogout: {
    type: Date
  },
  currentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashRegister'
  },
  
  // Tokens de acceso
  refreshToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  
  // Estadísticas
  stats: {
    totalSales: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalShifts: { type: Number, default: 0 },
    averageShiftDuration: { type: Number, default: 0 }
  },
  
  // Configuración personal
  preferences: {
    language: { type: String, default: 'es' },
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  
  // Notas
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Índices
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ employeeCode: 1 }, { sparse: true, unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isActive: 1 });

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// No devolver password ni tokens en queries
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// Método estático para generar código de empleado
userSchema.statics.generateEmployeeCode = async function() {
  const count = await this.countDocuments();
  const code = `EMP${String(count + 1).padStart(4, '0')}`;
  
  // Verificar que no existe
  const exists = await this.findOne({ employeeCode: code });
  if (exists) {
    return `EMP${String(count + 2).padStart(4, '0')}`;
  }
  
  return code;
};

// Método para activar/desactivar usuario
userSchema.methods.toggleActive = async function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Método para actualizar estadísticas
userSchema.methods.updateStats = async function(saleAmount, shiftDuration) {
  this.stats.totalSales += 1;
  this.stats.totalAmount += saleAmount;
  this.stats.totalShifts += 1;
  
  // Calcular promedio de duración de turnos
  const totalDuration = this.stats.averageShiftDuration * (this.stats.totalShifts - 1) + shiftDuration;
  this.stats.averageShiftDuration = totalDuration / this.stats.totalShifts;
  
  return this.save();
};

// Virtual para obtener nombre de rol
userSchema.virtual('roleName').get(function() {
  const roles = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    cashier: 'Cajero'
  };
  return roles[this.role] || this.role;
});

// Virtual para verificar si está en turno
userSchema.virtual('isOnShift').get(function() {
  return !!this.currentSession;
});

// Configurar toJSON para incluir virtuals
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
