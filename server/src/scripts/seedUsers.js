import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-santander';

// Usuarios de ejemplo
const users = [
  // ==========================================
  // ADMINISTRADORES
  // ==========================================
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrador Principal',
    email: 'admin@possantander.com',
    phone: '5551234567',
    role: 'admin',
    department: 'management',
    salary: 25000,
    hireDate: new Date('2023-01-01'),
    permissions: [], // Admin tiene todos los permisos por defecto
    workSchedule: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '14:00' }
    },
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true
    }
  },
  
  // ==========================================
  // SUPERVISORES
  // ==========================================
  {
    username: 'supervisor1',
    password: 'super123',
    fullName: 'María González Supervisor',
    email: 'maria.gonzalez@possantander.com',
    phone: '5552345678',
    role: 'supervisor',
    department: 'sales',
    salary: 18000,
    hireDate: new Date('2023-03-15'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'promotions', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: true, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
      saturday: { start: '08:00', end: '15:00' }
    }
  },
  {
    username: 'supervisor2',
    password: 'super123',
    fullName: 'Carlos Ramírez Supervisor',
    email: 'carlos.ramirez@possantander.com',
    phone: '5553456789',
    role: 'supervisor',
    department: 'sales',
    salary: 18000,
    hireDate: new Date('2023-06-01'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: true, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '14:00', end: '22:00' },
      tuesday: { start: '14:00', end: '22:00' },
      wednesday: { start: '14:00', end: '22:00' },
      thursday: { start: '14:00', end: '22:00' },
      friday: { start: '14:00', end: '22:00' },
      saturday: { start: '10:00', end: '18:00' }
    }
  },
  
  // ==========================================
  // CAJEROS TURNO MATUTINO
  // ==========================================
  {
    username: 'cajero1',
    password: 'cajero123',
    fullName: 'Ana Martínez Cajera',
    email: 'ana.martinez@possantander.com',
    phone: '5554567890',
    role: 'cashier',
    department: 'sales',
    salary: 12000,
    hireDate: new Date('2023-07-01'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '08:00', end: '16:00' },
      tuesday: { start: '08:00', end: '16:00' },
      wednesday: { start: '08:00', end: '16:00' },
      thursday: { start: '08:00', end: '16:00' },
      friday: { start: '08:00', end: '16:00' },
      saturday: { start: '08:00', end: '14:00' }
    }
  },
  {
    username: 'cajero2',
    password: 'cajero123',
    fullName: 'Luis Hernández Cajero',
    email: 'luis.hernandez@possantander.com',
    phone: '5555678901',
    role: 'cashier',
    department: 'sales',
    salary: 12000,
    hireDate: new Date('2023-08-15'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' }
    }
  },
  
  // ==========================================
  // CAJEROS TURNO VESPERTINO
  // ==========================================
  {
    username: 'cajero3',
    password: 'cajero123',
    fullName: 'Patricia López Cajera',
    email: 'patricia.lopez@possantander.com',
    phone: '5556789012',
    role: 'cashier',
    department: 'sales',
    salary: 12000,
    hireDate: new Date('2023-09-01'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      monday: { start: '14:00', end: '22:00' },
      tuesday: { start: '14:00', end: '22:00' },
      wednesday: { start: '14:00', end: '22:00' },
      thursday: { start: '14:00', end: '22:00' },
      friday: { start: '14:00', end: '22:00' },
      saturday: { start: '14:00', end: '20:00' }
    }
  },
  {
    username: 'cajero4',
    password: 'cajero123',
    fullName: 'Roberto Sánchez Cajero',
    email: 'roberto.sanchez@possantander.com',
    phone: '5557890123',
    role: 'cashier',
    department: 'sales',
    salary: 12000,
    hireDate: new Date('2023-10-15'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      wednesday: { start: '14:00', end: '22:00' },
      thursday: { start: '14:00', end: '22:00' },
      friday: { start: '14:00', end: '22:00' },
      saturday: { start: '14:00', end: '22:00' },
      sunday: { start: '10:00', end: '18:00' }
    }
  },
  
  // ==========================================
  // CAJEROS FIN DE SEMANA
  // ==========================================
  {
    username: 'cajero5',
    password: 'cajero123',
    fullName: 'Diana Torres Cajera',
    email: 'diana.torres@possantander.com',
    phone: '5558901234',
    role: 'cashier',
    department: 'sales',
    salary: 11000,
    hireDate: new Date('2024-01-10'),
    permissions: [
      { module: 'sales', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'cash', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'recharges', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'services', canView: true, canCreate: true, canEdit: false, canDelete: false }
    ],
    workSchedule: {
      friday: { start: '16:00', end: '22:00' },
      saturday: { start: '09:00', end: '21:00' },
      sunday: { start: '09:00', end: '21:00' }
    }
  }
];

async function seedUsers() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa a MongoDB');

    // Limpiar colección de usuarios (excepto admin si existe)
    console.log('\n🗑️  Limpiando colección de usuarios...');
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    // Si existe admin, no lo borramos
    if (existingAdmin) {
      await User.deleteMany({ username: { $ne: 'admin' } });
      console.log('✅ Usuarios limpiados (preservando admin existente)');
    } else {
      await User.deleteMany({});
      console.log('✅ Usuarios limpiados');
    }

    // Crear usuarios
    console.log('\n👥 Creando usuarios...');
    
    const usersToCreate = existingAdmin 
      ? users.filter(u => u.username !== 'admin')
      : users;
    
    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`✅ ${createdUsers.length} usuarios creados`);

    // Mostrar resumen por rol
    console.log('\n📊 RESUMEN POR ROL:');
    console.log('═══════════════════════════════════════');
    
    const allUsers = await User.find({});
    const byRole = {
      admin: allUsers.filter(u => u.role === 'admin').length,
      supervisor: allUsers.filter(u => u.role === 'supervisor').length,
      cashier: allUsers.filter(u => u.role === 'cashier').length
    };
    
    console.log(`Administradores: ${byRole.admin}`);
    console.log(`Supervisores: ${byRole.supervisor}`);
    console.log(`Cajeros: ${byRole.cashier}`);
    console.log('═══════════════════════════════════════');
    
    // Mostrar lista de usuarios
    console.log('\n📋 LISTA DE USUARIOS:');
    console.log('═══════════════════════════════════════');
    
    const usersList = await User.find({}).select('username fullName role employeeCode department').sort({ role: 1 });
    
    usersList.forEach((user, index) => {
      const roleLabel = user.role === 'admin' ? '👑' : user.role === 'supervisor' ? '👨‍💼' : '💼';
      console.log(`${(index + 1).toString().padStart(2)}. ${roleLabel} ${user.fullName.padEnd(35)} - ${user.username.padEnd(15)} [${user.employeeCode}]`);
    });
    
    console.log('═══════════════════════════════════════');
    
    // Mostrar credenciales de acceso
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('═══════════════════════════════════════');
    console.log('ADMINISTRADOR:');
    console.log('  Usuario: admin');
    console.log('  Contraseña: admin123');
    console.log('');
    console.log('SUPERVISOR:');
    console.log('  Usuario: supervisor1 / supervisor2');
    console.log('  Contraseña: super123');
    console.log('');
    console.log('CAJERO:');
    console.log('  Usuario: cajero1 / cajero2 / cajero3 / cajero4 / cajero5');
    console.log('  Contraseña: cajero123');
    console.log('═══════════════════════════════════════');
    
    console.log(`\n🎉 Seed completado exitosamente!`);
    console.log(`👥 Total de usuarios: ${allUsers.length}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedUsers();
