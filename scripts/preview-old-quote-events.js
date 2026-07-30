/**
 * READ-ONLY preview: shows exactly which events would be deleted by delete:old-quotes.
 * Does NOT modify anything.
 *
 * Run via Render Shell:
 *   node scripts/preview-old-quote-events.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import LeadEvent from '../models/LeadEvent.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI no definida'); process.exit(1); }

const run = async () => {
    await mongoose.connect(MONGO_URI);

    const events = await LeadEvent.find({
        'metadata.filePublicId': { $exists: true },
        'metadata.signedUrl':    { $exists: false },
    }).lean();

    console.log(`\n📋 Encontrados ${events.length} evento(s):\n`);

    for (const ev of events) {
        console.log('─────────────────────────────────');
        console.log(`  Evento ID   : ${ev._id}`);
        console.log(`  Lead ID     : ${ev.leadId}`);
        console.log(`  Usuario     : ${ev.userId}`);
        console.log(`  Tipo        : ${ev.eventType}`);
        console.log(`  Fecha       : ${ev.eventAt}`);
        console.log(`  Archivo     : ${ev.metadata?.filePublicId}`);
        console.log(`  Nota        : ${ev.metadata?.note || '(sin nota)'}`);
    }

    console.log('\n⚠️  ESTO ES SOLO UNA VISTA PREVIA — no se borró nada.\n');

    await mongoose.disconnect();
    process.exit(0);
};

run().catch((err) => { console.error('❌', err); process.exit(1); });
