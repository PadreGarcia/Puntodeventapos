/**
 * Script para verificar si MongoDB está corriendo y accesible
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🔍 VERIFICACIÓN DE MONGODB\n');
console.log('='.repeat(60));

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('\n❌ ERROR: MONGODB_URI no está definida');
  console.log('\n💡 Solución:');
  console.log('   1. Verifica que existe /server/.env');
  console.log('   2. Agrega: MONGODB_URI=mongodb://localhost:27017/pos_santander');
  console.log('   3. Ejecuta: npm run check-config\n');
  process.exit(1);
}

console.log(`\n📍 URI configurada: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);

// Determinar tipo de conexión
if (mongoUri.startsWith('mongodb://localhost') || mongoUri.startsWith('mongodb://127.0.0.1')) {
  console.log('📍 Tipo: MongoDB Local');
} else if (mongoUri.startsWith('mongodb+srv://')) {
  console.log('☁️  Tipo: MongoDB Atlas (nube)');
}

console.log('\n🔄 Intentando conectar...\n');

// Configurar timeout
const timeout = setTimeout(() => {
  console.error('❌ TIMEOUT: No se pudo conectar en 10 segundos');
  console.log('\n💡 Posibles causas:');
  console.log('   • MongoDB no está corriendo');
  console.log('   • Firewall bloqueando conexión');
  console.log('   • URI incorrecta');
  console.log('\n💡 Comandos para iniciar MongoDB:');
  console.log('   macOS:   brew services start mongodb-community');
  console.log('   Linux:   sudo systemctl start mongod');
  console.log('   Windows: mongod --dbpath C:\\data\\db\n');
  process.exit(1);
}, 10000);

// Intentar conectar
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then((conn) => {
    clearTimeout(timeout);
    
    console.log('✅ CONEXIÓN EXITOSA\n');
    console.log('='.repeat(60));
    console.log(`📦 Base de datos: ${conn.connection.name}`);
    console.log(`🖥️  Host: ${conn.connection.host}`);
    console.log(`🔌 Puerto: ${conn.connection.port}`);
    console.log(`📊 Estado: ${conn.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    
    // Obtener colecciones
    return conn.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log(`\n📂 Colecciones encontradas: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('\nColecciones:');
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    } else {
      console.log('   ⚠️  No hay colecciones (base de datos vacía)');
      console.log('   💡 Puedes poblar la BD con: npm run seed:all');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MongoDB está funcionando correctamente');
    console.log('🚀 Puedes iniciar el servidor con: npm run dev\n');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeout);
    
    console.error('\n❌ ERROR AL CONECTAR\n');
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB no está corriendo o no acepta conexiones');
      console.log('\nComandos para iniciar MongoDB:');
      console.log('   macOS:   brew services start mongodb-community');
      console.log('   Linux:   sudo systemctl start mongod');
      console.log('   Windows: mongod --dbpath C:\\data\\db');
      console.log('\nVerifica también que el puerto 27017 esté disponible:');
      console.log('   lsof -i :27017');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Error de autenticación');
      console.log('   Verifica usuario y contraseña en MONGODB_URI');
    } else if (error.message.includes('timed out')) {
      console.log('\n💡 Timeout de conexión');
      console.log('   • MongoDB está muy lento');
      console.log('   • Problemas de red');
      console.log('   • Si usas Atlas, verifica whitelist de IP');
    }
    
    console.log('\n💡 Ejecuta para más ayuda: npm run check-config\n');
    
    process.exit(1);
  });
