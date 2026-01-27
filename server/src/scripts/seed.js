import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    // Limpiar usuarios existentes
    await User.deleteMany({});

    // Crear usuario administrador por defecto
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrador del Sistema',
      email: 'admin@pos.com',
      role: 'admin',
      permissions: [],
      isActive: true
    });

    console.log('✅ Base de datos inicializada exitosamente');
    console.log('\n👤 Usuario Administrador Creado:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();
