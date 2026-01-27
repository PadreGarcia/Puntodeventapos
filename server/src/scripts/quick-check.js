/**
 * Script de verificación rápida del backend
 * Ejecutar con: npm run quick-check
 * 
 * Verifica:
 * - Estructura de archivos
 * - Dependencias instaladas
 * - Configuración
 * - Variables de entorno
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio raíz del servidor (2 niveles arriba)
const serverRoot = path.join(__dirname, '../..');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let problems = 0;

// Función para contar archivos en un directorio
function countFiles(dir, extension = '.js') {
  try {
    const fullPath = path.join(serverRoot, dir);
    if (!fs.existsSync(fullPath)) {
      return 0;
    }
    const files = fs.readdirSync(fullPath);
    return files.filter(file => file.endsWith(extension)).length;
  } catch (error) {
    return 0;
  }
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(serverRoot, filePath));
  } catch (error) {
    return false;
  }
}

// Función para mostrar resultado
function check(name, actual, expected, isWarning = false) {
  const status = actual === expected;
  const symbol = status ? '✅' : (isWarning ? '⚠️' : '❌');
  const color = status ? colors.green : (isWarning ? colors.yellow : colors.red);
  
  console.log(`📋 ${name}... ${color}${symbol} ${status ? 'OK' : (isWarning ? 'ADVERTENCIA' : 'FAIL')}${colors.reset} (esperado: ${expected}, actual: ${actual})`);
  
  if (!status && !isWarning) {
    problems++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🔍 Verificación Rápida del Backend');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📂 Directorio de trabajo: ${serverRoot}\n`);

// ===================================================
// 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
// ===================================================
console.log('1️⃣ Verificando estructura de archivos...\n');

const modelCount = countFiles('src/models');
const controllerCount = countFiles('src/controllers');
const routeCount = countFiles('src/routes');
const middlewareCount = countFiles('src/middleware');

check('Modelos', modelCount, 22);
check('Controladores', controllerCount, 20);
check('Rutas', routeCount, 21);
check('Middleware', middlewareCount, 1);

// ===================================================
// 2. VERIFICAR ARCHIVOS IMPORTANTES
// ===================================================
console.log('\n2️⃣ Verificando archivos de configuración...\n');

const configFiles = [
  { file: 'package.json', name: 'package.json', critical: true },
  { file: '.env', name: '.env', critical: false },
  { file: '.env.example', name: '.env.example', critical: false },
  { file: '.gitignore', name: '.gitignore', critical: false },
  { file: 'src/config/database.js', name: 'database.js', critical: true },
  { file: 'src/middleware/auth.js', name: 'auth.js', critical: true },
  { file: 'src/index.js', name: 'index.js (entry)', critical: true },
];

configFiles.forEach(({ file, name, critical }) => {
  const exists = fileExists(file);
  const symbol = exists ? '✅' : (critical ? '❌' : '⚠️');
  const color = exists ? colors.green : (critical ? colors.red : colors.yellow);
  const status = exists ? 'OK' : (critical ? 'NO ENCONTRADO' : 'NO ENCONTRADO (opcional)');
  
  console.log(`📋 ${name.padEnd(25)}... ${color}${symbol} ${status}${colors.reset}`);
  
  if (!exists && critical) {
    problems++;
  }
});

// ===================================================
// 3. VERIFICAR DEPENDENCIAS
// ===================================================
console.log('\n3️⃣ Verificando dependencias...\n');

try {
  const packageJsonPath = path.join(serverRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const requiredDeps = [
    'express',
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
    'dotenv',
    'cors',
    'morgan',
    'express-validator',
  ];
  
  console.log('Dependencias críticas:');
  requiredDeps.forEach(dep => {
    const installed = packageJson.dependencies && packageJson.dependencies[dep];
    const symbol = installed ? '✓' : '✗';
    const color = installed ? colors.green : colors.red;
    
    console.log(`  ${color}${symbol}${colors.reset} ${dep}${installed ? ` (${installed})` : ' (FALTA)'}`);
    
    if (!installed) {
      problems++;
    }
  });
  
  // Verificar devDependencies
  const devDeps = ['nodemon'];
  console.log('\nDependencias de desarrollo:');
  devDeps.forEach(dep => {
    const installed = packageJson.devDependencies && packageJson.devDependencies[dep];
    const symbol = installed ? '✓' : '⚠';
    const color = installed ? colors.green : colors.yellow;
    
    console.log(`  ${color}${symbol}${colors.reset} ${dep}${installed ? ` (${installed})` : ' (opcional)'}`);
  });
  
} catch (error) {
  console.log(`${colors.red}❌ Error leyendo package.json: ${error.message}${colors.reset}`);
  problems++;
}

// ===================================================
// 4. VERIFICAR VARIABLES DE ENTORNO
// ===================================================
console.log('\n4️⃣ Verificando variables de entorno...\n');

if (fileExists('.env')) {
  try {
    const envContent = fs.readFileSync(path.join(serverRoot, '.env'), 'utf-8');
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    
    requiredVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`);
      const symbol = hasVar ? '✓' : '✗';
      const color = hasVar ? colors.green : colors.red;
      
      console.log(`  ${color}${symbol}${colors.reset} ${varName}`);
      
      if (!hasVar) {
        problems++;
      }
    });
  } catch (error) {
    console.log(`${colors.red}❌ Error leyendo .env: ${error.message}${colors.reset}`);
    problems++;
  }
} else {
  console.log(`${colors.yellow}⚠️  Archivo .env no encontrado${colors.reset}`);
  console.log(`${colors.cyan}💡 Ejecuta: npm run check-config para crear uno${colors.reset}`);
}

// ===================================================
// 5. VERIFICAR SCRIPTS DE UTILIDAD
// ===================================================
console.log('\n5️⃣ Verificando scripts de utilidad...\n');

const utilityScripts = [
  'check-config.js',
  'check-mongodb.js',
  'verifySystem.js',
  'seedUsers.js',
  'seedRecharges.js',
  'seedServices.js',
];

utilityScripts.forEach(script => {
  const exists = fileExists(`src/scripts/${script}`);
  const symbol = exists ? '✓' : '⚠';
  const color = exists ? colors.green : colors.yellow;
  
  console.log(`  ${color}${symbol}${colors.reset} ${script}`);
});

// ===================================================
// RESUMEN FINAL
// ===================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (problems === 0) {
  console.log(`${colors.green}✅ VERIFICACIÓN COMPLETA: TODO CORRECTO${colors.reset}\n`);
  console.log('El backend está en perfecto estado ✨\n');
  console.log('Próximos pasos:');
  console.log(`  ${colors.blue}1.${colors.reset} npm run check-config  ${colors.cyan}# Verificar configuración${colors.reset}`);
  console.log(`  ${colors.blue}2.${colors.reset} npm run check-mongo   ${colors.cyan}# Verificar MongoDB${colors.reset}`);
  console.log(`  ${colors.blue}3.${colors.reset} npm run dev           ${colors.cyan}# Iniciar servidor${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ VERIFICACIÓN COMPLETA: ${problems} PROBLEMA(S) ENCONTRADO(S)${colors.reset}\n`);
  console.log('Revisa los errores arriba y corrige los problemas.\n');
  console.log('Ayuda rápida:');
  console.log(`  ${colors.cyan}•${colors.reset} Si faltan modelos/controladores: verifica que estés en el directorio correcto`);
  console.log(`  ${colors.cyan}•${colors.reset} Si faltan dependencias: ejecuta ${colors.blue}npm install${colors.reset}`);
  console.log(`  ${colors.cyan}•${colors.reset} Si falta .env: ejecuta ${colors.blue}npm run check-config${colors.reset}\n`);
  process.exit(1);
}
