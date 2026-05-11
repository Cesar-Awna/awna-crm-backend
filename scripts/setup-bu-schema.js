import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BusinessUnit from '../models/BusinessUnit.js';

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

const LEAD_SCHEMA = [
    { key: 'razonSocial',      label: 'Razón Social',              type: 'text',     required: true,  options: [], placeholder: 'Ej: Empresa SpA', order: 0 },
    { key: 'rutEmpresa',       label: 'RUT Empresa',               type: 'text',     required: true,  options: [], placeholder: 'Ej: 12.345.678-9', order: 1 },
    { key: 'nombreContacto',   label: 'Nombre del Contacto',       type: 'text',     required: true,  options: [], placeholder: 'Ej: Juan Pérez', order: 2 },
    { key: 'correo',           label: 'Correo',                    type: 'email',    required: true,  options: [], placeholder: 'Ej: juan@empresa.com', order: 3 },
    { key: 'telefono',         label: 'Teléfono',                  type: 'phone',    required: true,  options: [], placeholder: 'Ej: +56 9 1234 5678', order: 4 },
    { key: 'fechaIngreso',     label: 'Fecha de ingreso del lead',  type: 'date',     required: false, options: [], placeholder: 'dd/mm/aaaa', order: 5 },
];

const PIPELINE_STAGES = [
    { key: 'NUEVO',                 label: 'Nuevo',                    order: 0, color: '#38bdf8', stageType: 'open' },
    { key: 'DATO_ERRADO',           label: 'Dato errado',              order: 1, color: '#f87171', stageType: 'invalid' },
    { key: 'CONTACTADO',            label: 'Contactado',               order: 2, color: '#60a5fa', stageType: 'open' },
    { key: 'INTERESADO',            label: 'Interesado',               order: 3, color: '#a78bfa', stageType: 'open' },
    { key: 'COTIZACION_ENVIADA',    label: 'Cotización enviada',       order: 4, color: '#fbbf24', stageType: 'open' },
    { key: 'EN_SEGUIMIENTO',        label: 'En seguimiento',           order: 5, color: '#f97316', stageType: 'open' },
    { key: 'CERRADO_GANADO',        label: 'Cerrado ganado',           order: 6, color: '#10b981', stageType: 'won' },
    { key: 'CERRADO_PERDIDO',       label: 'Cerrado perdido',          order: 7, color: '#ef4444', stageType: 'lost' },
];

const ACTIVITY_TYPES = [
    { key: 'CALL',            label: 'Llamar',           pointValue: 1, dailyCap: 10 },
    { key: 'EMAIL_SENT',      label: 'Enviar info',      pointValue: 1, dailyCap: 5 },
    { key: 'MEETING',         label: 'Reunión',          pointValue: 3, dailyCap: 3 },
    { key: 'NOTE_ADDED',      label: 'Nota/bitácora',    pointValue: 0, dailyCap: 0 },
];

async function setupBUSchema() {
    try {
        console.log('\n🚀 Setting up Business Unit schemas...\n');

        const bu = await BusinessUnit.findOneAndUpdate(
            { code: 'EQUIFAX' },
            {
                leadSchema: LEAD_SCHEMA,
                pipelineStages: PIPELINE_STAGES,
                activityTypes: ACTIVITY_TYPES,
            },
            { new: true }
        );

        if (!bu) {
            console.error('❌ Business Unit EQUIFAX not found');
            process.exit(1);
        }

        console.log('✅ Business Unit EQUIFAX schema updated successfully\n');
        console.log(`📋 Lead Schema Fields: ${LEAD_SCHEMA.length}`);
        LEAD_SCHEMA.forEach((f) => console.log(`   - ${f.label} (${f.type})`));

        console.log(`\n🎯 Pipeline Stages: ${PIPELINE_STAGES.length}`);
        PIPELINE_STAGES.forEach((s) => console.log(`   - ${s.label}`));

        console.log(`\n📊 Activity Types: ${ACTIVITY_TYPES.length}`);
        ACTIVITY_TYPES.forEach((a) => console.log(`   - ${a.label}`));

        console.log('\n' + '='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    await setupBUSchema();
})();
