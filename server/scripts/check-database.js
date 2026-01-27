#!/usr/bin/env node

/**
 * 🔍 Script para verificar el contenido de la base de datos
 * 
 * Muestra un resumen de todos los datos en la BD:
 * - Usuarios (con roles)
 * - Productos (con categorías)
 * - Ventas, clientes, etc.
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

// Colores
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

/**
 * Conectar a MongoDB
 */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_santander';
    await mongoose.connect(uri);
    return true;
  } catch (error) {
    console.error(c('red', `✗ Error al conectar a MongoDB: ${error.message}`));
    return false;
  }
}

/**
 * Mostrar usuarios
 */
async function showUsers() {
  const users = await User.find({}, 'username fullName role isActive employeeCode').sort({ role: 1, username: 1 });
  
  console.log(c('bright', '\n👤 USUARIOS\n'));
  console.log('━'.repeat(80));
  
  if (users.length === 0) {
    console.log(c('yellow', '⚠️  No hay usuarios en la base de datos'));
    console.log(c('dim', '   Ejecuta: npm run seed'));
  } else {
    console.log(c('dim', `  Usuario          Nombre                    Rol           Código    Estado`));
    console.log('━'.repeat(80));
    
    users.forEach(user => {
      const roleColors = {
        admin: 'red',
        supervisor: 'yellow',
        cashier: 'green'
      };
      
      const roleLabels = {
        admin: 'Admin      ',
        supervisor: 'Supervisor ',
        cashier: 'Cajero     '
      };
      
      const status = user.isActive ? c('green', '✓ Activo') : c('red', '✗ Inactivo');
      const role = c(roleColors[user.role] || 'white', roleLabels[user.role] || user.role);
      
      console.log(
        `  ${user.username.padEnd(15)} ${user.fullName.padEnd(25).substring(0, 25)} ${role} ${user.employeeCode || '---'.padEnd(7)}   ${status}`
      );
    });
    
    // Resumen
    const adminCount = users.filter(u => u.role === 'admin').length;
    const supervisorCount = users.filter(u => u.role === 'supervisor').length;
    const cashierCount = users.filter(u => u.role === 'cashier').length;
    const activeCount = users.filter(u => u.isActive).length;
    
    console.log('━'.repeat(80));
    console.log(c('cyan', `  Total: ${users.length} usuarios  |  Activos: ${activeCount}  |  Admin: ${adminCount}  |  Supervisores: ${supervisorCount}  |  Cajeros: ${cashierCount}`));
  }
}

/**
 * Mostrar productos
 */
async function showProducts() {
  const products = await Product.find({}).sort({ category: 1, name: 1 });
  
  console.log(c('bright', '\n\n🛍️  PRODUCTOS\n'));
  console.log('━'.repeat(80));
  
  if (products.length === 0) {
    console.log(c('yellow', '⚠️  No hay productos en la base de datos'));
    console.log(c('dim', '   Ejecuta: npm run seed'));
  } else {
    const categories = [...new Set(products.map(p => p.category))].sort();
    
    categories.forEach(category => {
      const categoryProducts = products.filter(p => p.category === category);
      
      console.log(c('bright', `\n  📦 ${category} (${categoryProducts.length} productos)`));
      console.log('  ' + '─'.repeat(78));
      console.log(c('dim', `     Nombre                          Precio    Stock    Código de Barras`));
      console.log('  ' + '─'.repeat(78));
      
      categoryProducts.forEach(product => {
        const stockColor = product.stock <= product.minStock ? 'red' : 
                          product.stock <= product.reorderPoint ? 'yellow' : 'green';
        
        const stock = c(stockColor, String(product.stock).padStart(5));
        const price = c('cyan', `$${product.price.toFixed(2)}`.padStart(8));
        
        console.log(
          `     ${product.name.padEnd(30).substring(0, 30)}  ${price}  ${stock}    ${product.barcode || 'N/A'}`
        );
      });
    });
    
    // Resumen
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalCost = products.reduce((sum, p) => sum + ((p.cost || 0) * p.stock), 0);
    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    
    console.log('\n' + '━'.repeat(80));
    console.log(c('cyan', `  Total: ${products.length} productos  |  Categorías: ${categories.length}  |  Stock bajo: ${lowStock}`));
    console.log(c('dim', `  Valor en inventario: $${totalValue.toFixed(2)} (Costo: $${totalCost.toFixed(2)})`));
  }
}

/**
 * Mostrar estadísticas generales
 */
async function showStats() {
  console.log(c('bright', '\n\n📊 ESTADÍSTICAS\n'));
  console.log('━'.repeat(80));
  
  const collections = mongoose.connection.collections;
  const collectionNames = Object.keys(collections);
  
  console.log(c('cyan', '  Colecciones en la base de datos:'));
  console.log();
  
  for (const name of collectionNames) {
    const count = await collections[name].countDocuments();
    const icon = count > 0 ? c('green', '●') : c('dim', '○');
    console.log(`    ${icon} ${name.padEnd(25)} ${c('dim', `(${count} documentos)`)}`);
  }
  
  console.log('\n' + '━'.repeat(80));
}

/**
 * Main
 */
async function main() {
  console.log();
  console.log(c('bright', c('magenta', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));
  console.log(c('bright', c('magenta', '  🔍 VERIFICACIÓN DE BASE DE DATOS - Sistema POS Santander')));
  console.log(c('bright', c('magenta', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));
  
  const connected = await connectDB();
  
  if (!connected) {
    console.log();
    console.log(c('red', '❌ No se pudo conectar a MongoDB'));
    console.log(c('dim', '   Verifica que MongoDB esté corriendo: npm run check-mongo'));
    console.log();
    process.exit(1);
  }
  
  console.log(c('green', `\n✓ Conectado a: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_santander'}`));
  
  try {
    await showUsers();
    await showProducts();
    await showStats();
    
    console.log();
    console.log(c('bright', c('green', '✨ Verificación completada exitosamente')));
    console.log();
    console.log(c('dim', '💡 Comandos útiles:'));
    console.log(c('dim', '   npm run seed         # Insertar datos iniciales'));
    console.log(c('dim', '   npm run seed:clean   # Limpiar y volver a insertar'));
    console.log(c('dim', '   npm run dev          # Iniciar servidor'));
    console.log();
    
  } catch (error) {
    console.error(c('red', `\n❌ Error: ${error.message}`));
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
