import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-santander';

// Función para imprimir con color
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

// Lista de modelos esperados
const expectedModels = [
  'User',
  'Customer',
  'NFCCard',
  'AccountReceivable',
  'Loan',
  'Supplier',
  'PurchaseOrder',
  'ProductReceipt',
  'SupplierInvoice',
  'PayableAccount',
  'CashRegister',
  'CashCount',
  'Promotion',
  'Coupon',
  'RechargeCarrier',
  'RechargeProduct',
  'PhoneRecharge',
  'ServiceProvider',
  'ServicePayment',
  'Product',
  'Sale',
  'AuditLog'
];

// Lista de rutas esperadas
const expectedRoutes = [
  'authRoutes.js',
  'userRoutes.js',
  'customerRoutes.js',
  'nfcCardRoutes.js',
  'accountReceivableRoutes.js',
  'loanRoutes.js',
  'supplierRoutes.js',
  'purchaseOrderRoutes.js',
  'productReceiptRoutes.js',
  'supplierInvoiceRoutes.js',
  'payableAccountRoutes.js',
  'cashRegisterRoutes.js',
  'promotionRoutes.js',
  'couponRoutes.js',
  'rechargeRoutes.js',
  'servicePaymentRoutes.js',
  'productRoutes.js',
  'saleRoutes.js',
  'auditRoutes.js'
];

// Lista de controladores esperados
const expectedControllers = [
  'userController.js',
  'customerController.js',
  'purchaseController.js',
  'cashRegisterController.js',
  'promotionController.js',
  'rechargeController.js',
  'servicePaymentController.js'
];

async function verifyEnvironment() {
  log.title('═══════════════════════════════════════');
  log.title('    VERIFICACIÓN DEL SISTEMA POS       ');
  log.title('═══════════════════════════════════════');

  // 1. Verificar variables de entorno
  log.subtitle('\n1️⃣  VARIABLES DE ENTORNO');
  log.info('─────────────────────────────────────');
  
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
  let envOk = true;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log.success(`${envVar}: Configurado`);
    } else {
      log.error(`${envVar}: NO configurado`);
      envOk = false;
    }
  }

  if (!envOk) {
    log.error('\nAlgunas variables de entorno faltan. Revisa el archivo .env');
    return false;
  }

  return true;
}

async function verifyDatabase() {
  log.subtitle('\n2️⃣  CONEXIÓN A BASE DE DATOS');
  log.info('─────────────────────────────────────');

  try {
    log.info(`Conectando a: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    log.success(`MongoDB conectado: ${mongoose.connection.host}`);
    log.success(`Base de datos: ${mongoose.connection.name}`);
    
    // Verificar estado de conexión
    if (mongoose.connection.readyState === 1) {
      log.success('Estado de conexión: CONECTADO');
    } else {
      log.error('Estado de conexión: DESCONECTADO');
      return false;
    }

    return true;
  } catch (error) {
    log.error(`Error conectando a MongoDB: ${error.message}`);
    log.warning('Verifica que MongoDB esté corriendo: mongod');
    return false;
  }
}

async function verifyModels() {
  log.subtitle('\n3️⃣  MODELOS DE BASE DE DATOS');
  log.info('─────────────────────────────────────');

  const modelsPath = join(__dirname, '../models');
  let modelFiles = [];

  try {
    const files = fs.readdirSync(modelsPath);
    modelFiles = files.filter(f => f.endsWith('.js'));
    
    log.info(`Total de archivos .js encontrados: ${modelFiles.length}`);
    log.info(`Total de modelos esperados: ${expectedModels.length}`);
    
    let foundCount = 0;
    let missingModels = [];

    for (const model of expectedModels) {
      const modelFile = `${model}.js`;
      if (modelFiles.includes(modelFile)) {
        log.success(`Modelo ${model}: OK`);
        foundCount++;
      } else {
        log.warning(`Modelo ${model}: NO ENCONTRADO`);
        missingModels.push(model);
      }
    }

    log.info(`\n📊 Resumen: ${foundCount}/${expectedModels.length} modelos encontrados`);
    
    if (missingModels.length > 0) {
      log.warning(`\nModelos faltantes: ${missingModels.join(', ')}`);
    }

    return foundCount > 0;
  } catch (error) {
    log.error(`Error verificando modelos: ${error.message}`);
    return false;
  }
}

async function verifyRoutes() {
  log.subtitle('\n4️⃣  ARCHIVOS DE RUTAS');
  log.info('─────────────────────────────────────');

  const routesPath = join(__dirname, '../routes');
  let routeFiles = [];

  try {
    const files = fs.readdirSync(routesPath);
    routeFiles = files.filter(f => f.endsWith('.js') && f !== 'index.js');
    
    log.info(`Total de archivos de rutas: ${routeFiles.length}`);
    log.info(`Total de rutas esperadas: ${expectedRoutes.length}`);
    
    let foundCount = 0;
    let missingRoutes = [];

    for (const route of expectedRoutes) {
      if (routeFiles.includes(route)) {
        log.success(`Ruta ${route.replace('.js', '')}: OK`);
        foundCount++;
      } else {
        log.warning(`Ruta ${route.replace('.js', '')}: NO ENCONTRADO`);
        missingRoutes.push(route);
      }
    }

    log.info(`\n📊 Resumen: ${foundCount}/${expectedRoutes.length} archivos de rutas encontrados`);
    
    if (missingRoutes.length > 0) {
      log.warning(`\nRutas faltantes: ${missingRoutes.map(r => r.replace('.js', '')).join(', ')}`);
    }

    return foundCount > 0;
  } catch (error) {
    log.error(`Error verificando rutas: ${error.message}`);
    return false;
  }
}

async function verifyControllers() {
  log.subtitle('\n5️⃣  CONTROLADORES');
  log.info('─────────────────────────────────────');

  const controllersPath = join(__dirname, '../controllers');
  let controllerFiles = [];

  try {
    const files = fs.readdirSync(controllersPath);
    controllerFiles = files.filter(f => f.endsWith('.js'));
    
    log.info(`Total de controladores encontrados: ${controllerFiles.length}`);
    log.info(`Total de controladores esperados: ${expectedControllers.length}`);
    
    let foundCount = 0;

    for (const controller of expectedControllers) {
      if (controllerFiles.includes(controller)) {
        log.success(`Controlador ${controller.replace('Controller.js', '')}: OK`);
        foundCount++;
      } else {
        log.warning(`Controlador ${controller.replace('Controller.js', '')}: NO ENCONTRADO`);
      }
    }

    log.info(`\n📊 Resumen: ${foundCount}/${expectedControllers.length} controladores encontrados`);

    return foundCount > 0;
  } catch (error) {
    log.error(`Error verificando controladores: ${error.message}`);
    return false;
  }
}

async function verifyCollections() {
  log.subtitle('\n6️⃣  COLECCIONES EN BASE DE DATOS');
  log.info('─────────────────────────────────────');

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      log.warning('No hay colecciones en la base de datos');
      log.info('Esto es normal si es la primera vez que inicias el sistema');
      log.info('Ejecuta los scripts de seed para poblar la base de datos');
      return true;
    }

    log.info(`Total de colecciones: ${collections.length}\n`);

    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      log.success(`${collection.name}: ${count} documentos`);
    }

    return true;
  } catch (error) {
    log.error(`Error verificando colecciones: ${error.message}`);
    return false;
  }
}

async function verifyDependencies() {
  log.subtitle('\n7️⃣  DEPENDENCIAS NPM');
  log.info('─────────────────────────────────────');

  const packageJsonPath = join(__dirname, '../../package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    const requiredDeps = [
      'express',
      'mongoose',
      'cors',
      'dotenv',
      'bcryptjs',
      'jsonwebtoken',
      'morgan'
    ];

    let allInstalled = true;

    for (const dep of requiredDeps) {
      if (dependencies[dep]) {
        log.success(`${dep}: ${dependencies[dep]}`);
      } else {
        log.error(`${dep}: NO INSTALADO`);
        allInstalled = false;
      }
    }

    if (!allInstalled) {
      log.warning('\nAlgunas dependencias faltan. Ejecuta: npm install');
    }

    return allInstalled;
  } catch (error) {
    log.error(`Error verificando dependencias: ${error.message}`);
    return false;
  }
}

async function verifySeeds() {
  log.subtitle('\n8️⃣  SCRIPTS DE SEED');
  log.info('─────────────────────────────────────');

  const scriptsPath = join(__dirname);
  
  try {
    const files = fs.readdirSync(scriptsPath);
    const seedFiles = files.filter(f => f.startsWith('seed') && f.endsWith('.js'));
    
    if (seedFiles.length === 0) {
      log.warning('No hay scripts de seed disponibles');
      return true;
    }

    log.info(`Scripts de seed encontrados: ${seedFiles.length}\n`);

    for (const seed of seedFiles) {
      log.success(`${seed}`);
    }

    log.info('\n💡 Para ejecutar seeds:');
    seedFiles.forEach(seed => {
      log.info(`   node src/scripts/${seed}`);
    });

    return true;
  } catch (error) {
    log.error(`Error verificando seeds: ${error.message}`);
    return false;
  }
}

async function showSummary(results) {
  log.title('\n═══════════════════════════════════════');
  log.title('         RESUMEN DE VERIFICACIÓN       ');
  log.title('═══════════════════════════════════════\n');

  const checks = [
    { name: 'Variables de entorno', result: results.env },
    { name: 'Conexión a MongoDB', result: results.database },
    { name: 'Modelos', result: results.models },
    { name: 'Rutas', result: results.routes },
    { name: 'Controladores', result: results.controllers },
    { name: 'Colecciones', result: results.collections },
    { name: 'Dependencias NPM', result: results.dependencies },
    { name: 'Scripts de Seed', result: results.seeds }
  ];

  let passedCount = 0;
  let totalCount = checks.length;

  for (const check of checks) {
    if (check.result) {
      log.success(`${check.name}: PASÓ`);
      passedCount++;
    } else {
      log.error(`${check.name}: FALLÓ`);
    }
  }

  const percentage = ((passedCount / totalCount) * 100).toFixed(1);
  
  log.info(`\n📊 RESULTADO: ${passedCount}/${totalCount} verificaciones pasadas (${percentage}%)`);

  if (passedCount === totalCount) {
    log.title('\n🎉 ¡SISTEMA COMPLETAMENTE VERIFICADO!');
    log.success('El backend está listo para funcionar\n');
    return true;
  } else {
    log.warning('\n⚠️  HAY PROBLEMAS QUE RESOLVER');
    log.info('Revisa los errores arriba y corrígelos\n');
    return false;
  }
}

async function showNextSteps() {
  log.title('\n📝 PRÓXIMOS PASOS:\n');
  
  log.info('1. Si no hay colecciones, ejecuta los seeds:');
  log.info('   cd server');
  log.info('   node src/scripts/seedUsers.js');
  log.info('   node src/scripts/seedRecharges.js');
  log.info('   node src/scripts/seedServices.js');
  
  log.info('\n2. Inicia el servidor:');
  log.info('   npm run dev');
  
  log.info('\n3. Verifica el health check:');
  log.info('   curl http://localhost:5000/api/health');
  
  log.info('\n4. Prueba el login:');
  log.info('   curl -X POST http://localhost:5000/api/auth/login \\');
  log.info('     -H "Content-Type: application/json" \\');
  log.info('     -d \'{"username":"admin","password":"admin123"}\'');
  
  log.title('\n═══════════════════════════════════════\n');
}

// Ejecutar verificación
async function runVerification() {
  const results = {
    env: false,
    database: false,
    models: false,
    routes: false,
    controllers: false,
    collections: false,
    dependencies: false,
    seeds: false
  };

  try {
    // 1. Variables de entorno
    results.env = await verifyEnvironment();
    
    if (!results.env) {
      log.error('\n❌ Configuración de entorno incorrecta. Abortando verificación.');
      process.exit(1);
    }

    // 2. Conexión a base de datos
    results.database = await verifyDatabase();

    // 3. Modelos
    results.models = await verifyModels();

    // 4. Rutas
    results.routes = await verifyRoutes();

    // 5. Controladores
    results.controllers = await verifyControllers();

    // 6. Colecciones
    if (results.database) {
      results.collections = await verifyCollections();
    }

    // 7. Dependencias
    results.dependencies = await verifyDependencies();

    // 8. Seeds
    results.seeds = await verifySeeds();

    // Resumen
    const allOk = await showSummary(results);

    // Próximos pasos
    showNextSteps();

    process.exit(allOk ? 0 : 1);
  } catch (error) {
    log.error(`\n❌ Error durante la verificación: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
runVerification();
