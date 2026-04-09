import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI no está definida en .env');
  process.exit(1);
}

const SEED_EMAIL = process.env.SEED_EMAIL || 'admin@awna.demo';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';
const SEED_NAME = process.env.SEED_NAME || 'Admin Awna';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const existingUser = await User.findOne({ email: SEED_EMAIL }).lean();
    if (existingUser) {
      console.log('⚠️ Ya existe un usuario con email:', SEED_EMAIL);
      console.log('   No se crea nada. Para recrear, borra ese usuario en la colección users.');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    const user = await User.create({
      fullName: SEED_NAME,
      email: SEED_EMAIL,
      passwordHash: SEED_PASSWORD,
      isActive: true,
      roleName: 'SUPER_ADMIN',
    });
    console.log('✅ Usuario creado:', user.email, '| Rol: SUPER_ADMIN (sin compañía ni unidad)');

    console.log('\n--- Credenciales de acceso ---');
    console.log('Email:', SEED_EMAIL);
    console.log('Contraseña:', SEED_PASSWORD);
    console.log('-----------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
}

run();
