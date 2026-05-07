import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI no está definida en .env');
    process.exit(1);
}

const COLLECTIONS_TO_DROP = [
    'leads',
    'leadcontacts',
    'leadcompanies',
    'leaddocuments',
    'leadevents',
    'funnelstages',
    'slastagerules',
];

const run = async () => {
    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const existing = (await db.listCollections().toArray()).map((c) => c.name);

    for (const name of COLLECTIONS_TO_DROP) {
        if (!existing.includes(name)) {
            console.log(`↷ ${name} no existe, saltando.`);
            continue;
        }
        try {
            await db.dropCollection(name);
            console.log(`🗑️  Colección ${name} eliminada.`);
        } catch (error) {
            console.error(`❌ Error al eliminar ${name}:`, error.message);
        }
    }

    await mongoose.disconnect();
    console.log('✅ Listo. Conexión cerrada.');
    process.exit(0);
};

run().catch((error) => {
    console.error('❌ Error en reset-leads:', error);
    process.exit(1);
});
