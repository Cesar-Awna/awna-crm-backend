/**
 * Deletes LeadEvents with old quote attachment format (fileUrl/filePublicId)
 * and their corresponding Cloudinary assets.
 *
 * Run once via Render Shell:
 *   node scripts/delete-old-quote-events.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import LeadEvent from '../models/LeadEvent.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI no definida'); process.exit(1); }

cloudinary.config({ secure: true });

const run = async () => {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB conectado');

    const events = await LeadEvent.find({
        'metadata.filePublicId': { $exists: true },
        'metadata.signedUrl':    { $exists: false },
    }).lean();

    console.log(`🔍 Encontrados ${events.length} evento(s) a eliminar`);
    if (events.length === 0) {
        await mongoose.disconnect();
        process.exit(0);
    }

    for (const event of events) {
        const { filePublicId } = event.metadata;
        console.log(`\n→ Evento ${event._id}  |  lead: ${event.leadId}  |  publicId: ${filePublicId}`);

        // 1. Delete Cloudinary asset
        try {
            await cloudinary.uploader.destroy(filePublicId, {
                resource_type: 'raw',
                type: 'authenticated',
                invalidate: true,
            });
            console.log('   ✅ Archivo Cloudinary eliminado');
        } catch (err) {
            console.warn(`   ⚠️  Cloudinary: ${err.message} (continuando igual)`);
        }

        // 2. Delete LeadEvent from DB
        await LeadEvent.deleteOne({ _id: event._id });
        console.log('   ✅ Evento eliminado de la BD');
    }

    console.log('\n🏁 Listo.');
    await mongoose.disconnect();
    process.exit(0);
};

run().catch((err) => { console.error('❌', err); process.exit(1); });
