#!/usr/bin/env node

/**
 * 🌱 Script de Inicialización de Base de Datos
 * 
 * Este script crea datos iniciales para el sistema POS:
 * - Usuario administrador (admin/admin123)
 * - Usuarios de ejemplo
 * - Productos de ejemplo
 * - Categorías predefinidas
 * 
 * Uso:
 *   npm run seed          # Insertar datos
 *   npm run seed:clean    # Limpiar y volver a insertar
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

// Configurar __dirname para ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 DATOS DE SEED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 👤 USUARIOS
const users = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrador del Sistema',
    email: 'admin@possantander.com',
    phone: '+52 555-1234',
    role: 'admin',
    employeeCode: 'ADM001',
    department: 'management',
    hireDate: new Date('2024-01-01'),
    isActive: true,
    permissions: [
      // Ventas
      { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Productos
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Clientes
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Usuarios
      { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Reportes
      { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Caja
      { module: 'cashRegister', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Compras
      { module: 'purchases', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Servicios
      { module: 'services', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Préstamos
      { module: 'loans', canView: true, canCreate: true, canEdit: true, canDelete: true },
      // Configuración
      { module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true }
    ],
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true
    }
  },
  {
    username: 'supervisor1',
    password: 'super123',
    fullName: 'María García López',
    email: 'maria.garcia@possantander.com',
    phone: '+52 555-2345',
    role: 'supervisor',
    employeeCode: 'SUP001',
    department: 'sales',
    salary: 12000,
    hireDate: new Date('2024-02-15'),
    isActive: true,
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'cashRegister', canView: true, canCreate: true, canEdit: true, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '14:00' }
    }
  },
  {
    username: 'cajero1',
    password: 'cajero123',
    fullName: 'Juan Carlos Martínez',
    email: 'juan.martinez@possantander.com',
    phone: '+52 555-3456',
    role: 'cashier',
    employeeCode: 'CAJ001',
    department: 'sales',
    salary: 8000,
    hireDate: new Date('2024-03-01'),
    isActive: true,
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'cashRegister', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '07:00', end: '15:00' },
      tuesday: { start: '07:00', end: '15:00' },
      wednesday: { start: '07:00', end: '15:00' },
      thursday: { start: '07:00', end: '15:00' },
      friday: { start: '07:00', end: '15:00' }
    }
  },
  {
    username: 'cajero2',
    password: 'cajero123',
    fullName: 'Ana Laura Rodríguez',
    email: 'ana.rodriguez@possantander.com',
    phone: '+52 555-4567',
    role: 'cashier',
    employeeCode: 'CAJ002',
    department: 'sales',
    salary: 8000,
    hireDate: new Date('2024-03-01'),
    isActive: true,
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'cashRegister', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '15:00', end: '23:00' },
      tuesday: { start: '15:00', end: '23:00' },
      wednesday: { start: '15:00', end: '23:00' },
      thursday: { start: '15:00', end: '23:00' },
      friday: { start: '15:00', end: '23:00' },
      saturday: { start: '14:00', end: '22:00' },
      sunday: { start: '10:00', end: '18:00' }
    }
  }
];

// 🛍️ PRODUCTOS
const products = [
  // Bebidas
  {
    name: 'Coca-Cola 600ml',
    barcode: '7501055300006',
    price: 18.00,
    cost: 12.00,
    category: 'Bebidas',
    stock: 120,
    minStock: 24,
    reorderPoint: 36,
    description: 'Refresco de cola 600ml'
  },
  {
    name: 'Agua Ciel 1L',
    barcode: '7501055301003',
    price: 12.00,
    cost: 8.00,
    category: 'Bebidas',
    stock: 200,
    minStock: 48,
    reorderPoint: 72,
    description: 'Agua purificada 1 litro'
  },
  {
    name: 'Pepsi 600ml',
    barcode: '7501055302004',
    price: 18.00,
    cost: 12.00,
    category: 'Bebidas',
    stock: 80,
    minStock: 24,
    reorderPoint: 36,
    description: 'Refresco de cola 600ml'
  },
  {
    name: 'Jugos Del Valle 1L',
    barcode: '7501055303005',
    price: 28.00,
    cost: 18.00,
    category: 'Bebidas',
    stock: 60,
    minStock: 12,
    reorderPoint: 24,
    description: 'Jugo de naranja 1 litro'
  },
  {
    name: 'Red Bull 250ml',
    barcode: '7501055304006',
    price: 35.00,
    cost: 22.00,
    category: 'Bebidas',
    stock: 48,
    minStock: 12,
    reorderPoint: 18,
    description: 'Bebida energética 250ml'
  },
  
  // Botanas
  {
    name: 'Sabritas Original 45g',
    barcode: '7501055400001',
    price: 15.00,
    cost: 10.00,
    category: 'Botanas',
    stock: 150,
    minStock: 36,
    reorderPoint: 54,
    description: 'Papas fritas sabor original'
  },
  {
    name: 'Doritos Nacho 62g',
    barcode: '7501055401002',
    price: 18.00,
    cost: 12.00,
    category: 'Botanas',
    stock: 100,
    minStock: 24,
    reorderPoint: 36,
    description: 'Totopos sabor nacho'
  },
  {
    name: 'Cheetos Poffs 55g',
    barcode: '7501055402003',
    price: 16.00,
    cost: 11.00,
    category: 'Botanas',
    stock: 90,
    minStock: 24,
    reorderPoint: 36,
    description: 'Frituras de maíz con queso'
  },
  {
    name: 'Ruffles Queso 45g',
    barcode: '7501055403004',
    price: 15.50,
    cost: 10.50,
    category: 'Botanas',
    stock: 80,
    minStock: 24,
    reorderPoint: 36,
    description: 'Papas onduladas sabor queso'
  },
  {
    name: 'Cacahuates Japoneses 50g',
    barcode: '7501055404005',
    price: 12.00,
    cost: 8.00,
    category: 'Botanas',
    stock: 70,
    minStock: 20,
    reorderPoint: 30,
    description: 'Cacahuates estilo japonés'
  },
  
  // Dulces y Chocolates
  {
    name: 'Chocolate Hershey\'s 45g',
    barcode: '7501055500001',
    price: 22.00,
    cost: 14.00,
    category: 'Dulces',
    stock: 100,
    minStock: 20,
    reorderPoint: 30,
    description: 'Barra de chocolate con leche'
  },
  {
    name: 'Snickers 50g',
    barcode: '7501055501002',
    price: 20.00,
    cost: 13.00,
    category: 'Dulces',
    stock: 120,
    minStock: 24,
    reorderPoint: 36,
    description: 'Chocolate con cacahuate y caramelo'
  },
  {
    name: 'M&M\'s 45g',
    barcode: '7501055502003',
    price: 19.00,
    cost: 12.50,
    category: 'Dulces',
    stock: 90,
    minStock: 18,
    reorderPoint: 27,
    description: 'Chocolates de colores'
  },
  {
    name: 'Skittles 61g',
    barcode: '7501055503004',
    price: 18.00,
    cost: 12.00,
    category: 'Dulces',
    stock: 80,
    minStock: 16,
    reorderPoint: 24,
    description: 'Dulces sabor frutas'
  },
  {
    name: 'Pulparindo 14g',
    barcode: '7501055504005',
    price: 8.00,
    cost: 5.00,
    category: 'Dulces',
    stock: 200,
    minStock: 50,
    reorderPoint: 75,
    description: 'Dulce de tamarindo'
  },
  
  // Lácteos
  {
    name: 'Leche Lala 1L Entera',
    barcode: '7501055600001',
    price: 25.00,
    cost: 18.00,
    category: 'Lácteos',
    stock: 60,
    minStock: 12,
    reorderPoint: 18,
    description: 'Leche entera ultrapasteurizada 1L'
  },
  {
    name: 'Yogurt Danone Natural 1L',
    barcode: '7501055601002',
    price: 32.00,
    cost: 22.00,
    category: 'Lácteos',
    stock: 40,
    minStock: 8,
    reorderPoint: 12,
    description: 'Yogurt natural 1 litro'
  },
  {
    name: 'Queso Oaxaca 400g',
    barcode: '7501055602003',
    price: 65.00,
    cost: 45.00,
    category: 'Lácteos',
    stock: 30,
    minStock: 6,
    reorderPoint: 10,
    description: 'Queso Oaxaca 400 gramos'
  },
  
  // Abarrotes
  {
    name: 'Arroz San Miguel 1kg',
    barcode: '7501055700001',
    price: 38.00,
    cost: 28.00,
    category: 'Abarrotes',
    stock: 50,
    minStock: 10,
    reorderPoint: 15,
    description: 'Arroz blanco 1 kilogramo'
  },
  {
    name: 'Frijol Negro La Costeña 560g',
    barcode: '7501055701002',
    price: 24.00,
    cost: 16.00,
    category: 'Abarrotes',
    stock: 60,
    minStock: 12,
    reorderPoint: 18,
    description: 'Frijoles negros enteros 560g'
  },
  {
    name: 'Aceite Capullo 1L',
    barcode: '7501055702003',
    price: 42.00,
    cost: 32.00,
    category: 'Abarrotes',
    stock: 40,
    minStock: 8,
    reorderPoint: 12,
    description: 'Aceite vegetal 1 litro'
  },
  {
    name: 'Atún Herdez 140g',
    barcode: '7501055703004',
    price: 22.00,
    cost: 15.00,
    category: 'Abarrotes',
    stock: 80,
    minStock: 16,
    reorderPoint: 24,
    description: 'Atún en agua lata 140g'
  },
  {
    name: 'Sopa Nissin 64g',
    barcode: '7501055704005',
    price: 10.00,
    cost: 6.50,
    category: 'Abarrotes',
    stock: 120,
    minStock: 24,
    reorderPoint: 36,
    description: 'Sopa instantánea sabor pollo'
  },
  
  // Panadería
  {
    name: 'Pan Bimbo Blanco Grande',
    barcode: '7501055800001',
    price: 38.00,
    cost: 28.00,
    category: 'Panadería',
    stock: 40,
    minStock: 8,
    reorderPoint: 12,
    description: 'Pan de caja blanco 680g'
  },
  {
    name: 'Pan Integral Bimbo',
    barcode: '7501055801002',
    price: 42.00,
    cost: 31.00,
    category: 'Panadería',
    stock: 35,
    minStock: 7,
    reorderPoint: 10,
    description: 'Pan de caja integral 680g'
  },
  {
    name: 'Tortillas de Harina 1kg',
    barcode: '7501055802003',
    price: 35.00,
    cost: 25.00,
    category: 'Panadería',
    stock: 45,
    minStock: 9,
    reorderPoint: 14,
    description: 'Tortillas de harina de trigo 1kg'
  },
  
  // Higiene Personal
  {
    name: 'Jabón Dove 100g',
    barcode: '7501055900001',
    price: 28.00,
    cost: 19.00,
    category: 'Higiene',
    stock: 60,
    minStock: 12,
    reorderPoint: 18,
    description: 'Jabón en barra humectante'
  },
  {
    name: 'Shampoo Sedal 340ml',
    barcode: '7501055901002',
    price: 45.00,
    cost: 32.00,
    category: 'Higiene',
    stock: 40,
    minStock: 8,
    reorderPoint: 12,
    description: 'Shampoo para todo tipo de cabello'
  },
  {
    name: 'Papel Higiénico Pétalo 4 Rollos',
    barcode: '7501055902003',
    price: 32.00,
    cost: 22.00,
    category: 'Higiene',
    stock: 80,
    minStock: 16,
    reorderPoint: 24,
    description: 'Papel higiénico doble hoja 4 rollos'
  },
  {
    name: 'Pasta Colgate 75ml',
    barcode: '7501055903004',
    price: 35.00,
    cost: 24.00,
    category: 'Higiene',
    stock: 50,
    minStock: 10,
    reorderPoint: 15,
    description: 'Pasta dental triple acción'
  },
  
  // Limpieza
  {
    name: 'Cloro Cloralex 1L',
    barcode: '7501056000001',
    price: 28.00,
    cost: 19.00,
    category: 'Limpieza',
    stock: 50,
    minStock: 10,
    reorderPoint: 15,
    description: 'Blanqueador con cloro 1 litro'
  },
  {
    name: 'Detergente Ariel 1kg',
    barcode: '7501056001002',
    price: 68.00,
    cost: 48.00,
    category: 'Limpieza',
    stock: 40,
    minStock: 8,
    reorderPoint: 12,
    description: 'Detergente en polvo 1 kilogramo'
  },
  {
    name: 'Pinol Limpiador 1L',
    barcode: '7501056002003',
    price: 32.00,
    cost: 22.00,
    category: 'Limpieza',
    stock: 45,
    minStock: 9,
    reorderPoint: 14,
    description: 'Limpiador multiusos 1 litro'
  },
  {
    name: 'Fabuloso 1L',
    barcode: '7501056003004',
    price: 30.00,
    cost: 21.00,
    category: 'Limpieza',
    stock: 50,
    minStock: 10,
    reorderPoint: 15,
    description: 'Limpiador líquido lavanda 1L'
  }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 FUNCIONES PRINCIPALES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Conectar a MongoDB
 */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_santander';
    
    log.info(`Conectando a MongoDB: ${uri}`);
    
    await mongoose.connect(uri);
    
    log.success('Conectado a MongoDB exitosamente');
  } catch (error) {
    log.error(`Error al conectar a MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Insertar usuarios
 */
async function seedUsers() {
  log.title('👤 Insertando Usuarios');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const userData of users) {
    try {
      // Verificar si el usuario ya existe
      const exists = await User.findOne({ username: userData.username });
      
      if (exists) {
        log.warning(`Usuario '${userData.username}' ya existe - OMITIDO`);
        skipped++;
        continue;
      }
      
      // Crear nuevo usuario
      const user = new User(userData);
      await user.save();
      
      log.success(`Usuario '${userData.username}' creado - Rol: ${userData.role}`);
      inserted++;
      
    } catch (error) {
      log.error(`Error al crear usuario '${userData.username}': ${error.message}`);
    }
  }
  
  log.info(`\n📊 Usuarios: ${inserted} insertados, ${skipped} omitidos\n`);
}

/**
 * Insertar productos
 */
async function seedProducts() {
  log.title('🛍️  Insertando Productos');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const productData of products) {
    try {
      // Verificar si el producto ya existe por código de barras
      const exists = await Product.findOne({ barcode: productData.barcode });
      
      if (exists) {
        log.warning(`Producto '${productData.name}' ya existe - OMITIDO`);
        skipped++;
        continue;
      }
      
      // Crear nuevo producto
      const product = new Product(productData);
      await product.save();
      
      log.success(`Producto '${productData.name}' creado - $${productData.price}`);
      inserted++;
      
    } catch (error) {
      log.error(`Error al crear producto '${productData.name}': ${error.message}`);
    }
  }
  
  log.info(`\n📊 Productos: ${inserted} insertados, ${skipped} omitidos\n`);
}

/**
 * Limpiar base de datos
 */
async function cleanDatabase() {
  log.title('🗑️  Limpiando Base de Datos');
  
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    
    if (userCount > 0) {
      await User.deleteMany({});
      log.success(`${userCount} usuarios eliminados`);
    }
    
    if (productCount > 0) {
      await Product.deleteMany({});
      log.success(`${productCount} productos eliminados`);
    }
    
    if (userCount === 0 && productCount === 0) {
      log.info('Base de datos ya estaba vacía');
    }
    
  } catch (error) {
    log.error(`Error al limpiar base de datos: ${error.message}`);
    throw error;
  }
}

/**
 * Mostrar resumen
 */
async function showSummary() {
  log.title('📊 Resumen de Base de Datos');
  
  try {
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const supervisorCount = await User.countDocuments({ role: 'supervisor' });
    const cashierCount = await User.countDocuments({ role: 'cashier' });
    
    const productCount = await Product.countDocuments();
    const categories = await Product.distinct('category');
    
    console.log(`${colors.cyan}Usuarios:${colors.reset}`);
    console.log(`  Total:        ${userCount}`);
    console.log(`  Admin:        ${adminCount}`);
    console.log(`  Supervisores: ${supervisorCount}`);
    console.log(`  Cajeros:      ${cashierCount}`);
    console.log();
    console.log(`${colors.cyan}Productos:${colors.reset}`);
    console.log(`  Total:        ${productCount}`);
    console.log(`  Categorías:   ${categories.length} (${categories.join(', ')})`);
    console.log();
    
    // Mostrar credenciales
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.green}🔑 CREDENCIALES DE ACCESO${colors.reset}`);
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log();
    console.log(`${colors.bright}Administrador:${colors.reset}`);
    console.log(`  Usuario:   admin`);
    console.log(`  Password:  admin123`);
    console.log();
    console.log(`${colors.bright}Supervisor:${colors.reset}`);
    console.log(`  Usuario:   supervisor1`);
    console.log(`  Password:  super123`);
    console.log();
    console.log(`${colors.bright}Cajeros:${colors.reset}`);
    console.log(`  Usuario:   cajero1 / cajero2`);
    console.log(`  Password:  cajero123`);
    console.log();
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log();
    
  } catch (error) {
    log.error(`Error al generar resumen: ${error.message}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 EJECUCIÓN PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  try {
    console.log();
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}   🌱 SEED - Sistema POS Santander${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log();
    
    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const shouldClean = args.includes('--clean') || args.includes('-c');
    
    // Conectar a base de datos
    await connectDB();
    
    // Limpiar si se especificó
    if (shouldClean) {
      await cleanDatabase();
    }
    
    // Insertar datos
    await seedUsers();
    await seedProducts();
    
    // Mostrar resumen
    await showSummary();
    
    log.success('✨ Proceso completado exitosamente\n');
    
    process.exit(0);
    
  } catch (error) {
    log.error(`\n❌ Error fatal: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main();
