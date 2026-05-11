import connectMongoDB from '../libs/mongoose.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const hashExistingPasswords = async () => {
    try {
        connectMongoDB();

        console.log('🔍 Finding users with plain text passwords...');
        const users = await User.find({ passwordHash: { $exists: true, $ne: null } });

        let hashedCount = 0;
        let skipCount = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2)
            if (user.passwordHash.startsWith('$2')) {
                console.log(`⏭️  User ${user.email} already hashed`);
                skipCount++;
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(user.passwordHash, 10);
            await User.findByIdAndUpdate(user._id, { passwordHash: hashedPassword });
            console.log(`✅ Hashed password for ${user.email}`);
            hashedCount++;
        }

        console.log(`\n✨ Done! Hashed: ${hashedCount}, Already hashed: ${skipCount}, Total: ${users.length}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

hashExistingPasswords();
