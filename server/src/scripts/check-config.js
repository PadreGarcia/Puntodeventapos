/**
 * Script de verificación de configuración
 * Verifica que todas las variables de entorno necesarias estén configuradas
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN\n');
console.log('='.repeat(60));

// Variables requeridas
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT'
];

// Variables opcionales pero recomendadas
const optionalVars = [
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
  'BCRYPT_ROUNDS'
];

let allOk = true;

// Verificar archivo .env
const envPath = path.join(__dirname, '../../.env');
console.log(`\n📄 Archivo .env: ${envPath}`);
if (fs.existsSync(envPath)) {
  console.log('   ✅ Encontrado');
} else {
  console.log('   ❌ NO encontrado');
  console.log('   💡 Crea el archivo .env copiando .env.example');
  allOk = false;
}

// Verificar variables requeridas
console.log('\n📋 Variables REQUERIDAS:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Ocultar valores sensibles
    const displayValue = ['JWT_SECRET', 'MONGODB_URI'].includes(varName) 
      ? '***' + value.slice(-4)
      : value;
    console.log(`   ✅ ${varName.padEnd(20)} = ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName.padEnd(20)} = NO DEFINIDA`);
    allOk = false;
  }
});

// Verificar variables opcionales
console.log('\n📋 Variables OPCIONALES:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName.padEnd(20)} = ${value}`);
  } else {
    console.log(`   ⚠️  ${varName.padEnd(20)} = No definida (usando valor por defecto)`);
  }
});

// Verificar MongoDB URI
console.log('\n🔍 Análisis de MONGODB_URI:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  if (mongoUri.startsWith('mongodb://localhost') || mongoUri.startsWith('mongodb://127.0.0.1')) {
    console.log('   📍 Tipo: MongoDB Local');
    console.log('   💡 Asegúrate de que MongoDB esté corriendo localmente');
    console.log('      Ejecuta: mongod --dbpath /path/to/data');
  } else if (mongoUri.startsWith('mongodb+srv://')) {
    console.log('   ☁️  Tipo: MongoDB Atlas (nube)');
    console.log('   💡 Verifica que tu IP esté en la whitelist de Atlas');
  } else if (mongoUri === 'undefined') {
    console.log('   ❌ ERROR: La URI es literalmente "undefined"');
    console.log('   💡 Verifica que el archivo .env esté bien formateado');
    allOk = false;
  }
} else {
  console.log('   ❌ No definida');
  allOk = false;
}

// Verificar JWT_SECRET
console.log('\n🔐 Análisis de JWT_SECRET:');
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    console.log('   ⚠️  Longitud: Corta (recomendado: 32+ caracteres)');
  } else {
    console.log('   ✅ Longitud: Adecuada');
  }
  
  if (jwtSecret.includes('cambiar') || jwtSecret.includes('example')) {
    console.log('   ⚠️  ADVERTENCIA: Parece ser el valor de ejemplo');
    console.log('   💡 Cambia el JWT_SECRET en producción a algo único y seguro');
  }
} else {
  console.log('   ❌ No definida');
  allOk = false;
}

// Verificar puerto
console.log('\n🌐 Configuración de red:');
const port = process.env.PORT || 5000;
console.log(`   📍 Puerto: ${port}`);
console.log(`   🔗 API estará en: http://localhost:${port}/api`);

// Resultado final
console.log('\n' + '='.repeat(60));
if (allOk) {
  console.log('✅ CONFIGURACIÓN CORRECTA - Listo para iniciar el servidor\n');
  process.exit(0);
} else {
  console.log('❌ CONFIGURACIÓN INCOMPLETA - Corrige los errores antes de continuar\n');
  console.log('💡 Pasos para corregir:');
  console.log('   1. cd server');
  console.log('   2. cp .env.example .env');
  console.log('   3. Edita .env y configura las variables requeridas');
  console.log('   4. npm run check-config (para verificar)\n');
  process.exit(1);
}
