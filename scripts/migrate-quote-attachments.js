/**
 * One-time migration: normalise LeadEvent metadata for old QUOTE_SENT events.
 *
 * Old format:  { fileUrl, filePublicId }              (type: authenticated)
 * New format:  { signedUrl, attachmentName, thumbnailUrl, filePublicId }  (type: upload / public)
 *
 * For each old event the script:
 *   1. Generates a short-lived signed URL to access the authenticated Cloudinary asset.
 *   2. Re-uploads the file as type:'upload' (public) keeping the same publicId path.
 *   3. Deletes the old authenticated asset.
 *   4. Updates the LeadEvent metadata with the new public fields.
 *
 * Run once via Render Shell:
 *   node scripts/migrate-quote-attachments.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import LeadEvent from '../models/LeadEvent.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI no está definida en .env');
    process.exit(1);
}

cloudinary.config({ secure: true }); // uses CLOUDINARY_URL env var

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
    || process.env.CLOUDINARY_URL?.match(/@(.+)$/)?.[1];

if (!CLOUD_NAME) {
    console.error('❌ No se pudo determinar CLOUDINARY_CLOUD_NAME');
    process.exit(1);
}

const extractFilename = (publicId) => {
    const last = publicId.split('/').pop() || publicId;
    // Strip leading timestamp (e.g. "1722373200000_Bundle_Facoro.pdf" → "Bundle Facoro.pdf")
    return last.replace(/^\d+_/, '').replace(/_/g, ' ');
};

const buildThumbUrl = (publicId) =>
    `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_160,h_200,c_fit,pg_1/${publicId}.jpg`;

const run = async () => {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB conectado');

    const events = await LeadEvent.find({
        'metadata.filePublicId': { $exists: true },
        'metadata.signedUrl': { $exists: false },
    }).lean();

    console.log(`🔍 Encontrados ${events.length} evento(s) para migrar`);
    if (events.length === 0) {
        console.log('Nada que migrar.');
        await mongoose.disconnect();
        process.exit(0);
    }

    let ok = 0;
    let fail = 0;

    for (const event of events) {
        const { filePublicId } = event.metadata;
        console.log(`\n→ Evento ${event._id}  publicId: ${filePublicId}`);

        try {
            // 1. Generate a short-lived signed download URL for the authenticated asset
            const expiresAt = Math.floor(Date.now() / 1000) + 120;
            const downloadUrl = cloudinary.utils.private_download_url(filePublicId, undefined, {
                resource_type: 'raw',
                type: 'authenticated',
                expires_at: expiresAt,
            });

            // 2. Re-upload the file as public (type:'upload') using the signed URL as source
            const newPublicId = filePublicId.replace(/^leads\//, 'leads/pub_');
            const uploaded = await cloudinary.uploader.upload(downloadUrl, {
                public_id: newPublicId,
                resource_type: 'raw',
                type: 'upload',
                overwrite: true,
            });

            // 3. Delete the old authenticated asset
            await cloudinary.uploader.destroy(filePublicId, {
                resource_type: 'raw',
                type: 'authenticated',
                invalidate: true,
            });

            // 4. Update LeadEvent metadata
            const attachmentName = extractFilename(filePublicId);
            const thumbnailUrl = buildThumbUrl(newPublicId);

            await LeadEvent.updateOne(
                { _id: event._id },
                {
                    $set: {
                        'metadata.signedUrl': uploaded.secure_url,
                        'metadata.attachmentName': attachmentName,
                        'metadata.thumbnailUrl': thumbnailUrl,
                        'metadata.filePublicId': newPublicId,
                    },
                }
            );

            console.log(`   ✅ Migrado → ${uploaded.secure_url}`);
            ok++;
        } catch (err) {
            console.error(`   ❌ Error: ${err.message}`);
            fail++;
        }
    }

    console.log(`\n🏁 Migración completa: ${ok} ok, ${fail} fallidos`);
    await mongoose.disconnect();
    process.exit(fail > 0 ? 1 : 0);
};

run().catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
