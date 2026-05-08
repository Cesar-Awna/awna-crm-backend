import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Company from '../models/Company.js';
import BusinessUnit from '../models/BusinessUnit.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crm';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

function generateRandomPassword() {
    return Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function seedUserHierarchy() {
    try {
        console.log('\n🚀 Starting user hierarchy seed...\n');

        // 1. Create or find Company AWNA
        let company = await Company.findOne({ name: 'AWNA' });
        if (!company) {
            company = await Company.create({
                name: 'AWNA',
                status: 'ACTIVE',
            });
            console.log('✅ Created company: AWNA');
        } else {
            console.log('✅ Company AWNA already exists');
        }

        const companyId = company._id.toString();

        // 2. Create or find BusinessUnit Equifax
        let equifax = await BusinessUnit.findOne({ companyId, code: 'EQUIFAX' });
        if (!equifax) {
            equifax = await BusinessUnit.create({
                companyId,
                code: 'EQUIFAX',
                name: 'Equifax',
                isActive: true,
                leadSchema: [],
                activityTypes: [],
                pipelineStages: [],
            });
            console.log('✅ Created business unit: Equifax');
        } else {
            console.log('✅ Business unit Equifax already exists');
        }

        const equifaxId = equifax._id.toString();

        // 3. Generate passwords
        const superAdminPass = generateRandomPassword();
        const adminPass = generateRandomPassword();
        const supervisorPass = generateRandomPassword();

        const superAdminHashedPass = await hashPassword(superAdminPass);
        const adminHashedPass = await hashPassword(adminPass);
        const supervisorHashedPass = await hashPassword(supervisorPass);

        // 4. Create or update SUPER_ADMIN
        let superAdmin = await User.findOne({ email: 'superadmin@awna.cl' });
        if (!superAdmin) {
            superAdmin = await User.create({
                fullName: 'Super Admin',
                email: 'superadmin@awna.cl',
                passwordHash: superAdminHashedPass,
                roleName: 'SUPER_ADMIN',
                isActive: true,
                businessUnitIds: [],
                companyId: null,
                supervisorId: null,
            });
            console.log('✅ Created SUPER_ADMIN: superadmin@awna.cl');
        } else {
            await User.updateOne(
                { email: 'superadmin@awna.cl' },
                {
                    fullName: 'Super Admin',
                    roleName: 'SUPER_ADMIN',
                    passwordHash: superAdminHashedPass,
                    isActive: true,
                    businessUnitIds: [],
                    companyId: null,
                    supervisorId: null,
                }
            );
            console.log('✅ Updated SUPER_ADMIN: superadmin@awna.cl');
        }

        // 5. Create or update COMPANY_ADMIN
        let admin = await User.findOne({ email: 'daniel.caceres@awna.cl' });
        if (!admin) {
            admin = await User.create({
                fullName: 'Daniel Cáceres',
                email: 'daniel.caceres@awna.cl',
                passwordHash: adminHashedPass,
                roleName: 'COMPANY_ADMIN',
                companyId,
                businessUnitIds: [equifaxId],
                isActive: true,
                supervisorId: null,
            });
            console.log('✅ Created COMPANY_ADMIN: daniel.caceres@awna.cl');
        } else {
            await User.updateOne(
                { email: 'daniel.caceres@awna.cl' },
                {
                    fullName: 'Daniel Cáceres',
                    roleName: 'COMPANY_ADMIN',
                    companyId,
                    businessUnitIds: [equifaxId],
                    passwordHash: adminHashedPass,
                    isActive: true,
                    supervisorId: null,
                }
            );
            console.log('✅ Updated COMPANY_ADMIN: daniel.caceres@awna.cl');
        }

        const adminId = admin._id.toString();

        // 6. Create or update SUPERVISOR
        let supervisor = await User.findOne({ email: 'maria.orellana@awna.cl' });
        if (!supervisor) {
            supervisor = await User.create({
                fullName: 'María Orellana',
                email: 'maria.orellana@awna.cl',
                passwordHash: supervisorHashedPass,
                roleName: 'SUPERVISOR',
                companyId,
                businessUnitIds: [equifaxId],
                isActive: true,
                supervisorId: null,
            });
            console.log('✅ Created SUPERVISOR: maria.orellana@awna.cl');
        } else {
            await User.updateOne(
                { email: 'maria.orellana@awna.cl' },
                {
                    fullName: 'María Orellana',
                    roleName: 'SUPERVISOR',
                    companyId,
                    businessUnitIds: [equifaxId],
                    passwordHash: supervisorHashedPass,
                    isActive: true,
                    supervisorId: null,
                }
            );
            console.log('✅ Updated SUPERVISOR: maria.orellana@awna.cl');
        }

        const supervisorId = supervisor._id.toString();

        // 7. Assign existing EXECUTIVE users to maria as supervisor
        const executives = await User.find({
            companyId,
            businessUnitIds: { $in: [equifaxId] },
            roleName: 'EXECUTIVE',
            email: { $nin: ['superadmin@awna.cl', 'daniel.caceres@awna.cl', 'maria.orellana@awna.cl'] },
        });

        if (executives.length > 0) {
            await User.updateMany(
                {
                    companyId,
                    businessUnitIds: { $in: [equifaxId] },
                    roleName: 'EXECUTIVE',
                    email: { $nin: ['superadmin@awna.cl', 'daniel.caceres@awna.cl', 'maria.orellana@awna.cl'] },
                },
                { supervisorId }
            );
            console.log(`✅ Assigned ${executives.length} EXECUTIVE(s) to maria.orellana@awna.cl`);
        } else {
            console.log('ℹ️  No EXECUTIVE users found to assign');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 USER HIERARCHY SEED COMPLETED');
        console.log('='.repeat(60));
        console.log('\n🔑 GENERATED CREDENTIALS:\n');
        console.log(`SUPER_ADMIN:`);
        console.log(`  Email:    superadmin@awna.cl`);
        console.log(`  Password: ${superAdminPass}\n`);

        console.log(`COMPANY_ADMIN:`);
        console.log(`  Email:    daniel.caceres@awna.cl`);
        console.log(`  Password: ${adminPass}\n`);

        console.log(`SUPERVISOR:`);
        console.log(`  Email:    maria.orellana@awna.cl`);
        console.log(`  Password: ${supervisorPass}\n`);
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    await seedUserHierarchy();
})();
