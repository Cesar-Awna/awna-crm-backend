import mongoose from 'mongoose';
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

async function assignExecutivesToHierarchy() {
    try {
        console.log('\n🚀 Assigning executives to hierarchy...\n');

        // Get AWNA company
        const company = await Company.findOne({ name: 'AWNA' });
        if (!company) {
            console.error('❌ Company AWNA not found. Run seed-user-hierarchy.js first.');
            process.exit(1);
        }
        const companyId = company._id.toString();

        // Get Equifax BU
        const equifax = await BusinessUnit.findOne({ companyId, code: 'EQUIFAX' });
        if (!equifax) {
            console.error('❌ Business unit Equifax not found. Run seed-user-hierarchy.js first.');
            process.exit(1);
        }
        const equifaxId = equifax._id.toString();

        // Get María as supervisor
        const maria = await User.findOne({ email: 'maria.orellana@awna.cl' });
        if (!maria) {
            console.error('❌ Supervisor maria.orellana@awna.cl not found. Run seed-user-hierarchy.js first.');
            process.exit(1);
        }
        const supervisorId = maria._id.toString();

        // Executive emails to update
        const executiveEmails = [
            'valentina.graver@simple-soluciones.com',
            'pamela.cortes@simple-soluciones.com',
            'camila.montecinos@simple-soluciones.com',
            'cristofer.salinas@simple-soluciones.com',
        ];

        console.log('📝 Updating executives:\n');

        for (const email of executiveEmails) {
            const executive = await User.findOne({ email });
            if (executive) {
                await User.updateOne(
                    { email },
                    {
                        companyId,
                        businessUnitIds: [equifaxId],
                        supervisorId,
                        roleName: 'EXECUTIVE',
                        isActive: true,
                    }
                );
                console.log(`  ✅ ${email}`);
            } else {
                console.log(`  ⚠️  ${email} - not found in database`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ EXECUTIVES ASSIGNED TO HIERARCHY');
        console.log('='.repeat(60));
        console.log('\n📊 Summary:');
        console.log(`  Company:  AWNA`);
        console.log(`  Business Unit: Equifax`);
        console.log(`  Supervisor: maria.orellana@awna.cl`);
        console.log(`  Executives: ${executiveEmails.length}`);
        console.log('\n' + '='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    await assignExecutivesToHierarchy();
})();
