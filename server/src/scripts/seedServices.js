import mongoose from 'mongoose';
import ServiceProvider from '../models/ServiceProvider.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-santander';

// Proveedores de servicios
const providers = [
  // ==========================================
  // ENERGÍA
  // ==========================================
  {
    name: 'CFE (Luz)',
    code: 'CFE',
    category: 'energy',
    commission: 1.5,
    commissionFixed: 3,
    minAmount: 50,
    maxAmount: 50000,
    referenceLength: 10,
    active: true,
    instructions: 'Ingresa el número de servicio de 10 dígitos',
    icon: 'Zap',
    color: 'from-yellow-500 to-orange-500',
    metadata: {
      website: 'https://www.cfe.mx',
      supportPhone: '071',
      businessHours: '24/7'
    }
  },
  
  // ==========================================
  // TELECOMUNICACIONES
  // ==========================================
  {
    name: 'Telmex',
    code: 'TELMEX',
    category: 'telecom',
    commission: 2,
    minAmount: 100,
    maxAmount: 10000,
    referenceLength: 10,
    active: true,
    instructions: 'Número de línea telefónica de 10 dígitos',
    icon: 'Phone',
    color: 'from-blue-500 to-indigo-500',
    metadata: {
      website: 'https://www.telmex.com',
      supportPhone: '800-123-2222'
    }
  },
  {
    name: 'Telcel Recibo',
    code: 'TELCEL_BILL',
    category: 'telecom',
    commission: 1,
    minAmount: 20,
    maxAmount: 5000,
    requiresPhone: true,
    active: true,
    instructions: 'Pago de recibo mensual Telcel',
    icon: 'Phone',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    name: 'AT&T Recibo',
    code: 'ATT_BILL',
    category: 'telecom',
    commission: 1,
    minAmount: 20,
    maxAmount: 5000,
    requiresPhone: true,
    active: true,
    instructions: 'Pago de recibo mensual AT&T',
    icon: 'Phone',
    color: 'from-sky-500 to-sky-700'
  },
  {
    name: 'Movistar Recibo',
    code: 'MOVISTAR_BILL',
    category: 'telecom',
    commission: 1,
    minAmount: 20,
    maxAmount: 5000,
    requiresPhone: true,
    active: true,
    instructions: 'Pago de recibo mensual Movistar',
    icon: 'Phone',
    color: 'from-green-500 to-green-700'
  },
  {
    name: 'Izzi',
    code: 'IZZI',
    category: 'telecom',
    commission: 2,
    minAmount: 200,
    maxAmount: 5000,
    referenceLength: 12,
    active: true,
    instructions: 'Número de cuenta Izzi (12 dígitos)',
    icon: 'Wifi',
    color: 'from-purple-500 to-purple-700'
  },
  {
    name: 'Totalplay',
    code: 'TOTALPLAY',
    category: 'telecom',
    commission: 2,
    minAmount: 200,
    maxAmount: 5000,
    active: true,
    instructions: 'Número de cuenta Totalplay',
    icon: 'Wifi',
    color: 'from-red-500 to-red-700'
  },
  {
    name: 'Sky',
    code: 'SKY',
    category: 'telecom',
    commission: 2,
    minAmount: 300,
    maxAmount: 3000,
    active: true,
    instructions: 'Número de cuenta Sky',
    icon: 'Tv',
    color: 'from-blue-600 to-blue-800'
  },
  {
    name: 'Dish',
    code: 'DISH',
    category: 'telecom',
    commission: 2,
    minAmount: 300,
    maxAmount: 3000,
    active: true,
    instructions: 'Número de cuenta Dish',
    icon: 'Tv',
    color: 'from-orange-500 to-orange-700'
  },
  
  // ==========================================
  // AGUA Y GAS
  // ==========================================
  {
    name: 'Agua Municipal',
    code: 'AGUA_MUN',
    category: 'water_gas',
    commission: 1.5,
    commissionFixed: 5,
    minAmount: 50,
    maxAmount: 10000,
    active: true,
    instructions: 'Número de cuenta de agua potable',
    icon: 'Droplet',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    name: 'Naturgy (Gas Natural)',
    code: 'NATURGY',
    category: 'water_gas',
    commission: 2,
    minAmount: 100,
    maxAmount: 10000,
    active: true,
    instructions: 'Número de contrato Naturgy',
    icon: 'Flame',
    color: 'from-orange-500 to-red-500'
  },
  
  // ==========================================
  // GOBIERNO
  // ==========================================
  {
    name: 'Predial',
    code: 'PREDIAL',
    category: 'government',
    commission: 0,
    commissionFixed: 15,
    minAmount: 100,
    maxAmount: 100000,
    active: true,
    instructions: 'Número de cuenta predial',
    icon: 'FileText',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Tenencia',
    code: 'TENENCIA',
    category: 'government',
    commission: 0,
    commissionFixed: 15,
    minAmount: 100,
    maxAmount: 50000,
    active: true,
    instructions: 'Número de placas del vehículo',
    icon: 'FileText',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Infracciones',
    code: 'INFRACCIONES',
    category: 'government',
    commission: 0,
    commissionFixed: 20,
    minAmount: 100,
    maxAmount: 50000,
    active: true,
    instructions: 'Número de folio de infracción',
    icon: 'FileText',
    color: 'from-purple-500 to-pink-500'
  },
  
  // ==========================================
  // ENTRETENIMIENTO
  // ==========================================
  {
    name: 'Netflix',
    code: 'NETFLIX',
    category: 'entertainment',
    commission: 3,
    minAmount: 139,
    maxAmount: 299,
    requiresEmail: true,
    active: true,
    instructions: 'Email de cuenta Netflix',
    icon: 'Play',
    color: 'from-red-500 to-red-700',
    metadata: {
      website: 'https://www.netflix.com'
    }
  },
  {
    name: 'Spotify',
    code: 'SPOTIFY',
    category: 'entertainment',
    commission: 3,
    minAmount: 115,
    maxAmount: 199,
    requiresEmail: true,
    active: true,
    instructions: 'Email de cuenta Spotify',
    icon: 'Play',
    color: 'from-green-500 to-green-700',
    metadata: {
      website: 'https://www.spotify.com'
    }
  },
  {
    name: 'Disney+',
    code: 'DISNEY',
    category: 'entertainment',
    commission: 3,
    minAmount: 159,
    maxAmount: 249,
    requiresEmail: true,
    active: true,
    instructions: 'Email de cuenta Disney+',
    icon: 'Play',
    color: 'from-blue-500 to-blue-700',
    metadata: {
      website: 'https://www.disneyplus.com'
    }
  },
  {
    name: 'HBO Max',
    code: 'HBO',
    category: 'entertainment',
    commission: 3,
    minAmount: 149,
    maxAmount: 199,
    requiresEmail: true,
    active: true,
    instructions: 'Email de cuenta HBO Max',
    icon: 'Play',
    color: 'from-purple-500 to-purple-700',
    metadata: {
      website: 'https://www.hbomax.com'
    }
  },
  
  // ==========================================
  // FINANCIEROS
  // ==========================================
  {
    name: 'Tarjetas de Crédito',
    code: 'TARJETA_CREDITO',
    category: 'financial',
    commission: 0,
    commissionFixed: 10,
    minAmount: 100,
    maxAmount: 50000,
    active: true,
    instructions: 'Número de tarjeta o referencia de pago',
    icon: 'CreditCard',
    color: 'from-green-500 to-emerald-500'
  }
];

async function seedServices() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa a MongoDB');

    // Limpiar colecciones existentes
    console.log('\n🗑️  Limpiando colecciones existentes...');
    await ServiceProvider.deleteMany({});
    console.log('✅ Colecciones limpiadas');

    // Crear proveedores
    console.log('\n🏢 Creando proveedores de servicios...');
    const createdProviders = await ServiceProvider.insertMany(providers);
    console.log(`✅ ${createdProviders.length} proveedores creados`);

    // Mostrar resumen por categoría
    console.log('\n📊 RESUMEN POR CATEGORÍA:');
    console.log('═══════════════════════════════════════');
    
    const categories = {
      energy: 'Energía',
      telecom: 'Telecomunicaciones',
      water_gas: 'Agua y Gas',
      government: 'Gobierno',
      entertainment: 'Entretenimiento',
      financial: 'Financieros'
    };
    
    for (const [code, name] of Object.entries(categories)) {
      const count = createdProviders.filter(p => p.category === code).length;
      if (count > 0) {
        console.log(`${name.padEnd(25)} - ${count} proveedores`);
      }
    }
    
    console.log('═══════════════════════════════════════');
    console.log(`\n🎉 Seed completado exitosamente!`);
    console.log(`🏢 ${createdProviders.length} proveedores de servicios`);
    
    // Mostrar lista de proveedores
    console.log('\n📋 LISTA DE PROVEEDORES:');
    console.log('═══════════════════════════════════════');
    createdProviders.forEach((provider, index) => {
      const comision = provider.commissionFixed 
        ? `$${provider.commissionFixed}${provider.commission ? ` + ${provider.commission}%` : ''}`
        : `${provider.commission}%`;
      console.log(`${(index + 1).toString().padStart(2)}. ${provider.name.padEnd(25)} - Comisión: ${comision}`);
    });
    console.log('═══════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedServices();
