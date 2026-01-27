import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Verificar que existe la variable de entorno
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI no está definida en las variables de entorno.\n' +
        'Por favor crea un archivo .env en /server con la variable MONGODB_URI.\n' +
        'Ejemplo: MONGODB_URI=mongodb://localhost:27017/pos_santander'
      );
    }

    console.log('🔄 Conectando a MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    console.error('\n💡 Soluciones posibles:');
    console.error('  1. Verifica que MongoDB esté corriendo localmente');
    console.error('  2. Verifica que el archivo /server/.env exista y tenga MONGODB_URI');
    console.error('  3. Si usas MongoDB local: mongod debe estar activo');
    console.error('  4. Si usas MongoDB Atlas: verifica las credenciales y whitelist de IP\n');
    process.exit(1);
  }
};

// Manejo de eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Error en conexión MongoDB: ${err}`);
});
