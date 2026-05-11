import mongoose from 'mongoose';
import User from '../models/User.js';
import BusinessUnit from '../models/BusinessUnit.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const extractName = (email) => {
  const [namePart] = email.split('@');
  return namePart
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const main = async () => {
  try {
    // Conectar
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar empresa AWNA
    const company = await Company.findOne({ name: /awna/i });
    if (!company) {
      console.error('❌ No se encontró empresa AWNA');
      process.exit(1);
    }
    console.log(`✅ Empresa encontrada: ${company.name} (${company._id})\n`);

    // Buscar BU Equifax
    const bu = await BusinessUnit.findOne({ companyId: company._id, name: /equifax/i });
    if (!bu) {
      console.error('❌ No se encontró BU Equifax en la empresa');
      console.log('BUs disponibles:');
      const allBus = await BusinessUnit.find({ companyId: company._id });
      allBus.forEach(b => console.log(`  - ${b.name}`));
      process.exit(1);
    }
    console.log(`✅ BU encontrada: ${bu.name} (${bu._id})\n`);

    // Buscar supervisor María Orellana
    const supervisor = await User.findOne({ email: 'maria.orellana@awna.cl', companyId: company._id });
    if (!supervisor) {
      console.error('❌ No se encontró supervisor maria.orellana@awna.cl');
      process.exit(1);
    }
    console.log(`✅ Supervisor encontrado: ${supervisor.fullName} (${supervisor._id})\n`);

    // Usuarios a crear/actualizar
    const usersToCreate = [
      'valentina.graver@simple-soluciones.com',
      'pamela.cortes@simple-soluciones.com',
      'camila.montecinos@simple-soluciones.com',
      'cristofer.salinas@simple-soluciones.com',
      'rocio.castillo@simple-soluciones.com',
      'steven.contreras@simple-soluciones.com',
      'maria.febres@simple-soluciones.com',
      'maria.orellana.ejecutiva@awna.cl',
    ];

    const credentials = [];

    // Crear o actualizar usuarios
    for (const email of usersToCreate) {
      const password = generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const fullName = extractName(email);

      const existing = await User.findOne({ email, companyId: company._id });

      if (existing) {
        // Actualizar contraseña
        await User.updateOne(
          { _id: existing._id },
          {
            passwordHash,
            businessUnitIds: [bu._id],
            supervisorId: supervisor._id,
            roleName: 'EXECUTIVE',
          }
        );
        console.log(`✏️  Actualizado: ${fullName} (${email})`);
      } else {
        // Crear nuevo
        await User.create({
          email,
          fullName,
          passwordHash,
          companyId: company._id,
          businessUnitIds: [bu._id],
          supervisorId: supervisor._id,
          roleName: 'EXECUTIVE',
        });
        console.log(`✅ Creado: ${fullName} (${email})`);
      }

      credentials.push({
        email,
        password,
        fullName,
      });
    }

    console.log('\n📋 CREDENCIALES:\n');
    console.log('=====================================');
    credentials.forEach(cred => {
      console.log(`Email: ${cred.email}`);
      console.log(`Contraseña: ${cred.password}`);
      console.log('-------------------------------------');
    });

    console.log('\n✅ Todos los usuarios fueron procesados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();
