import mongoose from 'mongoose';

const ServiceProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['energy', 'telecom', 'water_gas', 'government', 'entertainment', 'financial']
  },
  // Comisiones
  commission: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Porcentaje
  },
  commissionFixed: {
    type: Number,
    default: 0,
    min: 0
  },
  // Límites
  minAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAmount: {
    type: Number,
    default: 100000
  },
  // Validaciones
  referenceLength: {
    type: Number,
    min: 1
  },
  requiresPhone: {
    type: Boolean,
    default: false
  },
  requiresEmail: {
    type: Boolean,
    default: false
  },
  // Estado
  active: {
    type: Boolean,
    default: true
  },
  // Instrucciones
  instructions: {
    type: String,
    trim: true
  },
  // Configuración de API externa
  apiConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    endpoint: String,
    apiKey: String,
    authType: {
      type: String,
      enum: ['none', 'basic', 'bearer', 'apikey']
    }
  },
  // Logo/Icono
  icon: {
    type: String,
    default: 'Receipt'
  },
  color: {
    type: String,
    default: 'from-gray-500 to-gray-700'
  },
  // Metadata
  metadata: {
    website: String,
    supportPhone: String,
    supportEmail: String,
    businessHours: String
  }
}, {
  timestamps: true
});

// Índices
ServiceProviderSchema.index({ code: 1 }, { unique: true });
ServiceProviderSchema.index({ category: 1, active: 1 });
ServiceProviderSchema.index({ active: 1 });

const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);
export default ServiceProvider;
