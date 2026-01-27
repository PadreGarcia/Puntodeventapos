#!/usr/bin/env node

/**
 * 🚀 Script de Configuración Inicial Completa
 * 
 * Este script realiza todos los pasos necesarios para configurar
 * el backend del sistema POS desde cero:
 * 
 * 1. Verifica la configuración
 * 2. Verifica la conexión a MongoDB
 * 3. Inserta datos iniciales
 * 4. Muestra resumen final
 * 
 * Uso:
 *   npm run setup           # Configuración inicial
 *   npm run setup:clean     # Limpiar y reconfigurar
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

// Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

// Colores
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${c.blue}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  warning: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  step: (num, msg) => console.log(`\n${c.bright}${c.cyan}━━ Paso ${num} ━━ ${msg}${c.reset}\n`)
};

let hasErrors = false;

/**
 * Paso 1: Verificar archivos de configuración
 */
async function checkConfiguration() {
  log.step(1, 'Verificando Configuración');
  
  const serverRoot = join(__dirname, '..');
  
  // Verificar .env
  const envPath = join(serverRoot, '.env');
  if (!existsSync(envPath)) {
    log.error('Archivo .env no encontrado');
    log.info('Creando .env desde .env.example...');
    hasErrors = true;
    return false;
  }
  log.success('Archivo .env encontrado');
  
  // Verificar variables importantes
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log.error(`Variables faltantes en .env: ${missingVars.join(', ')}`);
    hasErrors = true;
    return false;
  }
  
  log.success(`Variables de entorno configuradas correctamente`);
  log.info(`  MONGODB_URI: ${process.env.MONGODB_URI}`);
  log.info(`  PORT: ${process.env.PORT}`);
  
  return true;
}

/**
 * Paso 2: Verificar conexión a MongoDB
 */
async function checkMongoDB() {
  log.step(2, 'Verificando MongoDB');
  
  try {
    const uri = process.env.MONGODB_URI;
    log.info(`Conectando a: ${uri}`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    
    log.success('Conectado a MongoDB exitosamente');
    
    // Verificar que podemos listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    log.info(`Colecciones existentes: ${collections.length}`);
    
    return true;
    
  } catch (error) {
    log.error(`No se pudo conectar a MongoDB: ${error.message}`);
    log.warning('Verifica que MongoDB esté corriendo:');
    log.info('  - Windows: Inicia el servicio de MongoDB');
    log.info('  - O ejecuta: mongod');
    hasErrors = true;
    return false;
  }
}

/**
 * Paso 3: Insertar datos iniciales
 */
async function seedData(clean = false) {
  log.step(3, 'Insertando Datos Iniciales');
  
  try {
    // Limpiar si se especificó
    if (clean) {
      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();
      
      if (userCount > 0 || productCount > 0) {
        log.warning('Limpiando base de datos...');
        await User.deleteMany({});
        await Product.deleteMany({});
        log.success(`${userCount} usuarios y ${productCount} productos eliminados`);
      }
    }
    
    // Verificar si ya hay datos
    const existingUsers = await User.countDocuments();
    const existingProducts = await Product.countDocuments();
    
    if (existingUsers > 0 || existingProducts > 0) {
      log.warning(`La base de datos ya tiene datos (${existingUsers} usuarios, ${existingProducts} productos)`);
      log.info('Usa --clean para limpiar y volver a insertar');
      return true;
    }
    
    // Insertar usuario admin
    log.info('Creando usuario administrador...');
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrador del Sistema',
      email: 'admin@possantander.com',
      role: 'admin',
      employeeCode: 'ADM001',
      department: 'management',
      isActive: true,
      permissions: [
        { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true }
      ]
    });
    await admin.save();
    log.success('Usuario admin creado');
    
    // Insertar algunos productos de ejemplo
    log.info('Creando productos de ejemplo...');
    const sampleProducts = [
      { name: 'Coca-Cola 600ml', barcode: '7501055300006', price: 18, cost: 12, category: 'Bebidas', stock: 120, minStock: 24 },
      { name: 'Agua Ciel 1L', barcode: '7501055301003', price: 12, cost: 8, category: 'Bebidas', stock: 200, minStock: 48 },
      { name: 'Sabritas Original 45g', barcode: '7501055400001', price: 15, cost: 10, category: 'Botanas', stock: 150, minStock: 36 },
      { name: 'Chocolate Hershey\'s 45g', barcode: '7501055500001', price: 22, cost: 14, category: 'Dulces', stock: 100, minStock: 20 },
      { name: 'Pan Bimbo Blanco', barcode: '7501055800001', price: 38, cost: 28, category: 'Panadería', stock: 40, minStock: 8 }
    ];
    
    await Product.insertMany(sampleProducts);
    log.success(`${sampleProducts.length} productos creados`);
    
    log.info('');
    log.info('💡 Para insertar más datos, ejecuta: npm run seed');
    
    return true;
    
  } catch (error) {
    log.error(`Error al insertar datos: ${error.message}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Paso 4: Mostrar resumen final
 */
async function showSummary() {
  log.step(4, 'Resumen de Configuración');
  
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    
    console.log(`${c.cyan}Estado de la Base de Datos:${c.reset}`);
    console.log(`  Usuarios:  ${userCount}`);
    console.log(`  Productos: ${productCount}`);
    console.log();
    
    if (userCount > 0) {
      console.log(`${c.bright}${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
      console.log(`${c.bright}${c.green}🔑 CREDENCIALES DE ACCESO${c.reset}`);
      console.log(`${c.bright}${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
      console.log();
      console.log(`${c.bright}Administrador:${c.reset}`);
      console.log(`  Usuario:   admin`);
      console.log(`  Password:  admin123`);
      console.log();
      console.log(`${c.bright}${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
      console.log();
    }
    
    console.log(`${c.bright}Próximos pasos:${c.reset}`);
    console.log();
    console.log(`  1. ${c.cyan}npm run seed${c.reset}        # Insertar más datos (opcional)`);
    console.log(`  2. ${c.cyan}npm run check-db${c.reset}    # Ver contenido de la BD`);
    console.log(`  3. ${c.cyan}npm run dev${c.reset}         # Iniciar el servidor`);
    console.log();
    
  } catch (error) {
    log.error(`Error al generar resumen: ${error.message}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log();
  console.log(`${c.bright}${c.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bright}${c.magenta}   🚀 CONFIGURACIÓN INICIAL - Sistema POS Santander${c.reset}`);
  console.log(`${c.bright}${c.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  
  // Obtener argumentos
  const args = process.argv.slice(2);
  const clean = args.includes('--clean') || args.includes('-c');
  
  if (clean) {
    log.warning('Modo: Limpiar y reconfigurar');
  }
  
  try {
    // Ejecutar pasos
    const configOk = await checkConfiguration();
    if (!configOk) {
      throw new Error('Configuración inválida');
    }
    
    const mongoOk = await checkMongoDB();
    if (!mongoOk) {
      throw new Error('No se pudo conectar a MongoDB');
    }
    
    const seedOk = await seedData(clean);
    if (!seedOk) {
      throw new Error('Error al insertar datos');
    }
    
    await showSummary();
    
    if (!hasErrors) {
      console.log(`${c.bright}${c.green}✨ Configuración completada exitosamente${c.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${c.bright}${c.yellow}⚠️  Configuración completada con advertencias${c.reset}\n`);
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`\n❌ Error fatal: ${error.message}\n`);
    console.log(`${c.dim}Revisa los pasos anteriores y corrige los errores.${c.reset}\n`);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

main();
