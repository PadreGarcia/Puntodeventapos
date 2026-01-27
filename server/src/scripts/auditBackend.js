import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  detail: (msg) => console.log(`${colors.magenta}  ↳ ${msg}${colors.reset}`)
};

// Leer archivos de un directorio
function readFilesFromDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  return files.filter(f => f.endsWith('.js'));
}

// Extraer imports de un archivo
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Buscar imports de modelos: import Model from '../models/ModelName.js'
  const importRegex = /import\s+(\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importName = match[1];
    const importPath = match[2];
    imports.push({ name: importName, path: importPath });
  }
  
  return imports;
}

// Analizar modelos
function analyzeModels() {
  log.title('═══════════════════════════════════════');
  log.title('  1️⃣  ANÁLISIS DE MODELOS');
  log.title('═══════════════════════════════════════');
  
  const modelsPath = path.join(__dirname, '../models');
  const modelFiles = readFilesFromDir(modelsPath);
  
  const models = {};
  
  log.info(`\nModelos encontrados: ${modelFiles.length}`);
  
  modelFiles.forEach(file => {
    const modelName = file.replace('.js', '');
    const filePath = path.join(modelsPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar referencias a otros modelos
    const modelRefs = [];
    const refRegex = /mongoose\.model\(['"](\w+)['"]\)/g;
    let match;
    
    while ((match = refRegex.exec(content)) !== null) {
      if (match[1] !== modelName) {
        modelRefs.push(match[1]);
      }
    }
    
    // Buscar schema references
    const schemaRefRegex = /ref:\s*['"](\w+)['"]/g;
    while ((match = schemaRefRegex.exec(content)) !== null) {
      if (!modelRefs.includes(match[1])) {
        modelRefs.push(match[1]);
      }
    }
    
    models[modelName] = {
      file: file,
      references: modelRefs,
      usedBy: []
    };
    
    log.success(`${modelName}`);
    if (modelRefs.length > 0) {
      log.detail(`Referencias: ${modelRefs.join(', ')}`);
    }
  });
  
  return models;
}

// Analizar controladores
function analyzeControllers() {
  log.title('\n═══════════════════════════════════════');
  log.title('  2️⃣  ANÁLISIS DE CONTROLADORES');
  log.title('═══════════════════════════════════════');
  
  const controllersPath = path.join(__dirname, '../controllers');
  const controllerFiles = readFilesFromDir(controllersPath);
  
  const controllers = {};
  
  log.info(`\nControladores encontrados: ${controllerFiles.length}`);
  
  controllerFiles.forEach(file => {
    const controllerName = file.replace('.js', '');
    const filePath = path.join(controllersPath, file);
    const imports = extractImports(filePath);
    
    // Filtrar solo imports de modelos
    const modelImports = imports.filter(imp => 
      imp.path.includes('../models/') || imp.path.includes('./models/')
    );
    
    const modelNames = modelImports.map(imp => {
      const modelPath = imp.path.split('/').pop().replace('.js', '');
      return modelPath;
    });
    
    controllers[controllerName] = {
      file: file,
      models: modelNames,
      routes: []
    };
    
    log.success(`${controllerName}`);
    if (modelNames.length > 0) {
      log.detail(`Modelos usados: ${modelNames.join(', ')}`);
    } else {
      log.warning(`No usa modelos directamente`);
    }
  });
  
  return controllers;
}

// Analizar rutas
function analyzeRoutes() {
  log.title('\n═══════════════════════════════════════');
  log.title('  3️⃣  ANÁLISIS DE RUTAS');
  log.title('═══════════════════════════════════════');
  
  const routesPath = path.join(__dirname, '../routes');
  const routeFiles = readFilesFromDir(routesPath).filter(f => f !== 'index.js');
  
  const routes = {};
  
  log.info(`\nArchivos de rutas encontrados: ${routeFiles.length}`);
  
  routeFiles.forEach(file => {
    const routeName = file.replace('.js', '');
    const filePath = path.join(routesPath, file);
    const imports = extractImports(filePath);
    
    // Filtrar imports de controladores
    const controllerImports = imports.filter(imp => 
      imp.path.includes('../controllers/') || imp.path.includes('./controllers/')
    );
    
    const controllerNames = controllerImports.map(imp => {
      const ctrlPath = imp.path.split('/').pop().replace('.js', '');
      return ctrlPath;
    });
    
    // Extraer endpoints del archivo
    const content = fs.readFileSync(filePath, 'utf8');
    const endpoints = [];
    const endpointRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = endpointRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    routes[routeName] = {
      file: file,
      controllers: controllerNames,
      endpoints: endpoints
    };
    
    log.success(`${routeName}`);
    if (controllerNames.length > 0) {
      log.detail(`Controladores: ${controllerNames.join(', ')}`);
    }
    log.detail(`Endpoints: ${endpoints.length}`);
  });
  
  return routes;
}

// Verificar coherencia
function verifyCoherence(models, controllers, routes) {
  log.title('\n═══════════════════════════════════════');
  log.title('  4️⃣  VERIFICACIÓN DE COHERENCIA');
  log.title('═══════════════════════════════════════');
  
  const issues = {
    unusedModels: [],
    unusedControllers: [],
    missingModels: [],
    missingControllers: [],
    orphanRoutes: []
  };
  
  // Verificar modelos no usados
  log.subtitle('\n📦 Verificando uso de modelos...');
  Object.keys(models).forEach(modelName => {
    const usedInControllers = Object.values(controllers).some(ctrl => 
      ctrl.models.includes(modelName)
    );
    
    if (!usedInControllers) {
      issues.unusedModels.push(modelName);
      log.warning(`Modelo ${modelName} no usado en controladores`);
    } else {
      log.success(`Modelo ${modelName} en uso`);
    }
  });
  
  // Verificar controladores no usados
  log.subtitle('\n🎮 Verificando uso de controladores...');
  Object.keys(controllers).forEach(controllerName => {
    const usedInRoutes = Object.values(routes).some(route => 
      route.controllers.includes(controllerName)
    );
    
    if (!usedInRoutes && controllerName !== 'authController') {
      issues.unusedControllers.push(controllerName);
      log.warning(`Controlador ${controllerName} no usado en rutas`);
    } else {
      log.success(`Controlador ${controllerName} en uso`);
    }
  });
  
  // Verificar referencias a modelos que no existen
  log.subtitle('\n🔍 Verificando referencias de modelos...');
  Object.entries(controllers).forEach(([controllerName, controller]) => {
    controller.models.forEach(modelName => {
      if (!models[modelName]) {
        issues.missingModels.push({ controller: controllerName, model: modelName });
        log.error(`Controlador ${controllerName} referencia modelo inexistente: ${modelName}`);
      }
    });
  });
  
  // Verificar referencias a controladores que no existen
  log.subtitle('\n🔍 Verificando referencias de controladores...');
  Object.entries(routes).forEach(([routeName, route]) => {
    route.controllers.forEach(controllerName => {
      if (!controllers[controllerName]) {
        issues.missingControllers.push({ route: routeName, controller: controllerName });
        log.error(`Ruta ${routeName} referencia controlador inexistente: ${controllerName}`);
      }
    });
  });
  
  return issues;
}

// Generar mapa de dependencias
function generateDependencyMap(models, controllers, routes) {
  log.title('\n═══════════════════════════════════════');
  log.title('  5️⃣  MAPA DE DEPENDENCIAS');
  log.title('═══════════════════════════════════════');
  
  const map = {};
  
  // Construir mapa: Ruta -> Controlador -> Modelo
  Object.entries(routes).forEach(([routeName, route]) => {
    const routePath = routeName.replace('Routes', '');
    
    map[routePath] = {
      endpoints: route.endpoints.length,
      controllers: [],
      models: new Set()
    };
    
    route.controllers.forEach(ctrlName => {
      if (controllers[ctrlName]) {
        map[routePath].controllers.push(ctrlName);
        
        controllers[ctrlName].models.forEach(modelName => {
          map[routePath].models.add(modelName);
        });
      }
    });
    
    map[routePath].models = Array.from(map[routePath].models);
  });
  
  log.info('\nMapa de dependencias:\n');
  
  Object.entries(map).forEach(([route, data]) => {
    log.success(`/${route}`);
    log.detail(`${data.endpoints} endpoints`);
    if (data.controllers.length > 0) {
      log.detail(`Controladores: ${data.controllers.join(', ')}`);
    }
    if (data.models.length > 0) {
      log.detail(`Modelos: ${data.models.join(', ')}`);
    }
    console.log('');
  });
  
  return map;
}

// Generar estadísticas
function generateStats(models, controllers, routes, issues) {
  log.title('\n═══════════════════════════════════════');
  log.title('  6️⃣  ESTADÍSTICAS DEL SISTEMA');
  log.title('═══════════════════════════════════════');
  
  const totalEndpoints = Object.values(routes).reduce((sum, route) => 
    sum + route.endpoints.length, 0
  );
  
  const stats = {
    models: Object.keys(models).length,
    controllers: Object.keys(controllers).length,
    routes: Object.keys(routes).length,
    endpoints: totalEndpoints,
    issues: {
      unusedModels: issues.unusedModels.length,
      unusedControllers: issues.unusedControllers.length,
      missingModels: issues.missingModels.length,
      missingControllers: issues.missingControllers.length
    }
  };
  
  log.info('\n📊 Resumen:');
  log.success(`${stats.models} modelos`);
  log.success(`${stats.controllers} controladores`);
  log.success(`${stats.routes} archivos de rutas`);
  log.success(`${stats.endpoints} endpoints totales`);
  
  log.subtitle('\n⚠️  Problemas detectados:');
  if (stats.issues.unusedModels > 0) {
    log.warning(`${stats.issues.unusedModels} modelos sin usar`);
  }
  if (stats.issues.unusedControllers > 0) {
    log.warning(`${stats.issues.unusedControllers} controladores sin usar`);
  }
  if (stats.issues.missingModels > 0) {
    log.error(`${stats.issues.missingModels} referencias a modelos inexistentes`);
  }
  if (stats.issues.missingControllers > 0) {
    log.error(`${stats.issues.missingControllers} referencias a controladores inexistentes`);
  }
  
  const totalIssues = Object.values(stats.issues).reduce((a, b) => a + b, 0);
  
  if (totalIssues === 0) {
    log.title('\n🎉 ¡NO HAY PROBLEMAS DE COHERENCIA!');
    log.success('Todos los modelos, controladores y rutas están correctamente conectados');
  } else {
    log.title('\n⚠️  SE ENCONTRARON PROBLEMAS');
    log.warning(`Total de problemas: ${totalIssues}`);
  }
  
  return stats;
}

// Verificar nombres consistentes
function verifyNamingConsistency(models, controllers, routes) {
  log.title('\n═══════════════════════════════════════');
  log.title('  7️⃣  VERIFICACIÓN DE NOMENCLATURA');
  log.title('═══════════════════════════════════════');
  
  const namingIssues = [];
  
  log.subtitle('\n🏷️  Verificando consistencia de nombres...\n');
  
  // Mapeo de rutas esperadas según modelos
  const expectedMappings = {
    'User': { controller: 'userController', route: 'userRoutes' },
    'Customer': { controller: 'customerController', route: 'customerRoutes' },
    'Product': { controller: 'productController', route: 'productRoutes' },
    'Sale': { controller: 'saleController', route: 'saleRoutes' },
    'Supplier': { controller: 'supplierController', route: 'supplierRoutes' },
    'PurchaseOrder': { controller: 'purchaseOrderController', route: 'purchaseOrderRoutes' },
    'Promotion': { controller: 'promotionController', route: 'promotionRoutes' },
    'CashRegister': { controller: 'cashRegisterController', route: 'cashRegisterRoutes' },
    'NFCCard': { controller: 'nfcCardController', route: 'nfcCardRoutes' },
    'Loan': { controller: 'loanController', route: 'loanRoutes' }
  };
  
  Object.entries(expectedMappings).forEach(([modelName, expected]) => {
    const hasController = controllers[expected.controller];
    const hasRoute = routes[expected.route];
    
    if (models[modelName]) {
      if (hasController && hasRoute) {
        log.success(`${modelName} → ${expected.controller} → ${expected.route} ✓`);
      } else {
        if (!hasController) {
          log.warning(`${modelName}: falta controlador ${expected.controller}`);
          namingIssues.push({ type: 'missing-controller', model: modelName });
        }
        if (!hasRoute) {
          log.warning(`${modelName}: falta ruta ${expected.route}`);
          namingIssues.push({ type: 'missing-route', model: modelName });
        }
      }
    }
  });
  
  if (namingIssues.length === 0) {
    log.title('\n✅ NOMENCLATURA CONSISTENTE');
  } else {
    log.warning(`\n⚠️  ${namingIssues.length} problemas de nomenclatura`);
  }
  
  return namingIssues;
}

// Ejecutar auditoría completa
async function runAudit() {
  try {
    log.title('═══════════════════════════════════════');
    log.title('   AUDITORÍA COMPLETA DEL BACKEND      ');
    log.title('═══════════════════════════════════════');
    log.info('Verificando coherencia y consistencia del sistema...\n');
    
    // 1. Analizar modelos
    const models = analyzeModels();
    
    // 2. Analizar controladores
    const controllers = analyzeControllers();
    
    // 3. Analizar rutas
    const routes = analyzeRoutes();
    
    // 4. Verificar coherencia
    const issues = verifyCoherence(models, controllers, routes);
    
    // 5. Generar mapa de dependencias
    const dependencyMap = generateDependencyMap(models, controllers, routes);
    
    // 6. Generar estadísticas
    const stats = generateStats(models, controllers, routes, issues);
    
    // 7. Verificar nomenclatura
    const namingIssues = verifyNamingConsistency(models, controllers, routes);
    
    // Resumen final
    log.title('\n═══════════════════════════════════════');
    log.title('         RESUMEN DE AUDITORÍA          ');
    log.title('═══════════════════════════════════════\n');
    
    log.info('📦 Arquitectura:');
    log.success(`  ${stats.models} Modelos`);
    log.success(`  ${stats.controllers} Controladores`);
    log.success(`  ${stats.routes} Archivos de Rutas`);
    log.success(`  ${stats.endpoints} Endpoints REST`);
    
    const totalIssues = Object.values(stats.issues).reduce((a, b) => a + b, 0) + namingIssues.length;
    
    if (totalIssues === 0) {
      log.title('\n🎉 ¡SISTEMA TOTALMENTE COHERENTE!');
      log.success('✓ Todos los modelos están conectados');
      log.success('✓ Todos los controladores están en uso');
      log.success('✓ Todas las rutas tienen controladores válidos');
      log.success('✓ La nomenclatura es consistente');
      log.success('✓ No hay referencias rotas');
      log.title('\n✅ EL BACKEND ES UN PRODUCTO INTEGRADO\n');
      return true;
    } else {
      log.warning('\n⚠️  SE DETECTARON INCONSISTENCIAS');
      log.warning(`Total de problemas: ${totalIssues}`);
      
      if (issues.unusedModels.length > 0) {
        log.warning(`\nModelos sin usar: ${issues.unusedModels.join(', ')}`);
      }
      if (issues.unusedControllers.length > 0) {
        log.warning(`\nControladores sin usar: ${issues.unusedControllers.join(', ')}`);
      }
      if (issues.missingModels.length > 0) {
        log.error(`\nReferencias a modelos inexistentes detectadas`);
      }
      if (issues.missingControllers.length > 0) {
        log.error(`\nReferencias a controladores inexistentes detectadas`);
      }
      
      console.log('');
      return false;
    }
    
  } catch (error) {
    log.error(`\nError durante la auditoría: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Ejecutar
runAudit().then(success => {
  process.exit(success ? 0 : 1);
});
