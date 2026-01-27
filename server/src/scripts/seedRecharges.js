import mongoose from 'mongoose';
import RechargeCarrier from '../models/RechargeCarrier.js';
import RechargeProduct from '../models/RechargeProduct.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-santander';

// Operadores
const carriers = [
  {
    name: 'Telcel',
    code: 'TELCEL',
    color: 'from-blue-500 to-blue-700',
    logo: 'Smartphone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data', 'social', 'unlimited']
  },
  {
    name: 'AT&T',
    code: 'ATT',
    color: 'from-sky-500 to-sky-700',
    logo: 'Phone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data', 'social', 'unlimited']
  },
  {
    name: 'Movistar',
    code: 'MOVISTAR',
    color: 'from-green-500 to-green-700',
    logo: 'Smartphone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data', 'social', 'unlimited']
  },
  {
    name: 'Unefon',
    code: 'UNEFON',
    color: 'from-purple-500 to-purple-700',
    logo: 'Phone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data', 'social', 'unlimited']
  },
  {
    name: 'Virgin Mobile',
    code: 'VIRGIN',
    color: 'from-red-500 to-red-700',
    logo: 'Smartphone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data', 'social', 'unlimited']
  },
  {
    name: 'Weex',
    code: 'WEEX',
    color: 'from-orange-500 to-orange-700',
    logo: 'Phone',
    active: true,
    commissionRate: 0.05,
    supportedProductTypes: ['airtime', 'data']
  }
];

// Plantillas de productos (se crearán para cada operador)
const productTemplates = {
  airtime: [
    { name: '$20', description: 'Tiempo Aire', price: 20 },
    { name: '$30', description: 'Tiempo Aire', price: 30 },
    { name: '$50', description: 'Tiempo Aire', price: 50 },
    { name: '$100', description: 'Tiempo Aire', price: 100 },
    { name: '$150', description: 'Tiempo Aire', price: 150 },
    { name: '$200', description: 'Tiempo Aire', price: 200 },
    { name: '$300', description: 'Tiempo Aire', price: 300 },
    { name: '$500', description: 'Tiempo Aire', price: 500 }
  ],
  data: [
    { name: '1 GB', description: 'Internet 7 días', price: 50, validity: '7 días', dataAmount: '1 GB' },
    { name: '2 GB', description: 'Internet 15 días', price: 80, validity: '15 días', dataAmount: '2 GB' },
    { name: '3 GB', description: 'Internet 30 días', price: 120, validity: '30 días', dataAmount: '3 GB' },
    { name: '5 GB', description: 'Internet 30 días', price: 180, validity: '30 días', dataAmount: '5 GB' },
    { name: '10 GB', description: 'Internet 30 días', price: 300, validity: '30 días', dataAmount: '10 GB' },
    { name: '20 GB', description: 'Internet 30 días', price: 500, validity: '30 días', dataAmount: '20 GB' }
  ],
  social: [
    { name: 'Facebook', description: '30 días ilimitado', price: 30, validity: '30 días' },
    { name: 'WhatsApp', description: '30 días ilimitado', price: 30, validity: '30 días' },
    { name: 'Redes Sociales', description: 'FB + WA + IG 30 días', price: 50, validity: '30 días' }
  ],
  unlimited: [
    { name: 'Ilimitado 1 día', description: 'Todo ilimitado', price: 35, validity: '1 día' },
    { name: 'Ilimitado 7 días', description: 'Todo ilimitado', price: 150, validity: '7 días' },
    { name: 'Ilimitado 30 días', description: 'Todo ilimitado', price: 500, validity: '30 días' }
  ]
};

async function seedRecharges() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa a MongoDB');

    // Limpiar colecciones existentes
    console.log('\n🗑️  Limpiando colecciones existentes...');
    await RechargeProduct.deleteMany({});
    await RechargeCarrier.deleteMany({});
    console.log('✅ Colecciones limpiadas');

    // Crear operadores
    console.log('\n📱 Creando operadores...');
    const createdCarriers = await RechargeCarrier.insertMany(carriers);
    console.log(`✅ ${createdCarriers.length} operadores creados`);

    // Crear productos para cada operador
    console.log('\n📦 Creando productos...');
    let totalProducts = 0;

    for (const carrier of createdCarriers) {
      console.log(`\n   Creando productos para ${carrier.name}...`);
      
      for (const type of carrier.supportedProductTypes) {
        const templates = productTemplates[type];
        
        if (!templates) continue;

        for (const template of templates) {
          const product = {
            carrier: carrier._id,
            name: template.name,
            description: template.description,
            type: type,
            price: template.price,
            validity: template.validity || null,
            dataAmount: template.dataAmount || null,
            active: true,
            sku: `${carrier.code}-${type.toUpperCase()}-${template.price || template.name}`.replace(/\s/g, '-')
          };

          await RechargeProduct.create(product);
          totalProducts++;
        }
      }
      
      console.log(`   ✅ Productos creados para ${carrier.name}`);
    }

    console.log(`\n✅ Total de ${totalProducts} productos creados`);

    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    console.log('═══════════════════════════════════════');
    
    for (const carrier of createdCarriers) {
      const productCount = await RechargeProduct.countDocuments({ carrier: carrier._id });
      console.log(`${carrier.name.padEnd(20)} - ${productCount} productos`);
    }
    
    console.log('═══════════════════════════════════════');
    console.log(`\n🎉 Seed completado exitosamente!`);
    console.log(`📱 ${createdCarriers.length} operadores`);
    console.log(`📦 ${totalProducts} productos de recarga`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedRecharges();
