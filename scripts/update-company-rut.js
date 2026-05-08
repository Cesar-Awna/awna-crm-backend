import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/Company.js';

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

async function updateCompanyRUT() {
    try {
        console.log('\n🚀 Updating company RUT...\n');

        const company = await Company.findOneAndUpdate(
            { name: 'AWNA' },
            { rut: '76.123.456-7' },
            { new: true }
        );

        if (!company) {
            console.error('❌ Company AWNA not found');
            process.exit(1);
        }

        console.log('✅ Company AWNA updated successfully');
        console.log(`   Name: ${company.name}`);
        console.log(`   RUT: ${company.rut}`);
        console.log(`   Status: ${company.status}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    await updateCompanyRUT();
})();
