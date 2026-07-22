/**
 * setup-getnet-bu.js
 *
 * Crea la BusinessUnit GETNET con su schema completo.
 * SAFE: usa findOneAndUpdate con upsert:true → solo crea/actualiza GETNET.
 * NO TOCA Equifax ni ningún otro documento.
 *
 * Uso:
 *   node --experimental-vm-modules scripts/setup-getnet-bu.js
 *   npx tsx scripts/setup-getnet-bu.js
 *   (desde awna-crm-backend, con .env presente)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BusinessUnit from '../models/BusinessUnit.js';
import Company from '../models/Company.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definido en .env');
    process.exit(1);
}

// ─── Lead Schema ──────────────────────────────────────────────────────────────
// Ningún campo es requerido (el ejecutivo llena lo que tiene disponible
// desde el primer contacto, según los requerimientos de Getnet).

const LEAD_SCHEMA = [
    {
        key: 'nombre', label: 'Nombre del cliente',
        type: 'text', required: false, options: [], placeholder: 'Ej: Juan Pérez', order: 0,
    },
    {
        key: 'telefono', label: 'Teléfono',
        type: 'phone', required: false, options: [], placeholder: 'Ej: +56 9 1234 5678', order: 1,
    },
    {
        key: 'correo', label: 'Correo electrónico',
        type: 'email', required: false, options: [], placeholder: 'Ej: contacto@empresa.cl', order: 2,
    },
    {
        key: 'razonSocial', label: 'Razón social',
        type: 'text', required: false, options: [], placeholder: 'Ej: Comercial ABC SpA', order: 3,
    },
    {
        key: 'tipoComercio', label: 'Tipo de comercio o servicio',
        type: 'text', required: false, options: [], placeholder: 'Ej: Restaurant, Retail, etc.', order: 4,
    },
    {
        key: 'medioPrimerContacto', label: 'Medio del primer contacto',
        type: 'select', required: false,
        options: ['Llamada telefónica', 'Correo electrónico', 'WhatsApp', 'Visita en terreno'],
        placeholder: '', order: 5,
    },
    {
        key: 'resultadoPrimerContacto', label: 'Resultado del primer contacto',
        type: 'select', required: false,
        options: ['Contacto válido', 'Sin contacto válido'],
        placeholder: '', order: 6,
    },
    {
        key: 'direccionVisita', label: 'Dirección de visita',
        type: 'text', required: false, options: [], placeholder: 'Ej: Av. Providencia 1234', order: 7,
    },
    {
        key: 'comunaVisita', label: 'Comuna',
        type: 'text', required: false, options: [], placeholder: 'Ej: Providencia', order: 8,
    },
    {
        key: 'fueAtendido', label: '¿Fue atendido en visita?',
        type: 'select', required: false,
        options: ['Sí', 'No'],
        placeholder: '', order: 9,
    },
    {
        key: 'entregInfoComercial', label: '¿Pudo entregar información comercial?',
        type: 'select', required: false,
        options: ['Sí', 'No'],
        placeholder: '', order: 10,
    },
    {
        key: 'productosInteres', label: 'Productos de interés',
        type: 'multiselect', required: false,
        options: ['SmartPOS', 'POS Integrado', 'Pago con QR', 'Web Checkout', 'Link de Pago', 'PAD Getnet'],
        placeholder: '', order: 11,
    },
    {
        key: 'esClienteSantander', label: '¿Es cliente Santander?',
        type: 'select', required: false,
        options: ['Sí', 'No'],
        placeholder: '', order: 12,
    },
    {
        key: 'motivoObjecion', label: 'Motivo de objeción',
        type: 'select', required: false,
        options: [
            'Ya trabaja con otra empresa',
            'Considera que el precio es alto',
            'No le interesa en este momento',
            'Las condiciones comerciales no le acomodan',
            'Otro',
        ],
        placeholder: '', order: 13,
    },
    {
        key: 'observacionObjecion', label: 'Observaciones de objeción',
        type: 'textarea', required: false, options: [],
        placeholder: 'Detalle adicional sobre el motivo de objeción…', order: 14,
    },
];

// ─── Pipeline Stages ──────────────────────────────────────────────────────────
// Cubre todo el ciclo comercial: primer contacto → cierre definitivo.

const PIPELINE_STAGES = [
    { key: 'NUEVO',                 label: 'Nuevo',                      order:  0, color: '#38bdf8', stageType: 'open'    },
    { key: 'CONTACTO_VALIDO',       label: 'Contacto válido',            order:  1, color: '#60a5fa', stageType: 'open'    },
    { key: 'SIN_CONTACTO',          label: 'Sin contacto válido',        order:  2, color: '#94a3b8', stageType: 'open'    },
    { key: 'DATO_ERRADO',           label: 'Dato errado',                order:  3, color: '#f87171', stageType: 'invalid' },
    { key: 'VISITA_AGENDADA',       label: 'Visita agendada',            order:  4, color: '#a78bfa', stageType: 'open'    },
    { key: 'VISITA_REALIZADA',      label: 'Visita realizada',           order:  5, color: '#818cf8', stageType: 'open'    },
    { key: 'OFERTA_PRESENTADA',     label: 'Oferta presentada',          order:  6, color: '#fbbf24', stageType: 'open'    },
    { key: 'OFERTA_RECHAZADA',      label: 'Oferta rechazada',           order:  7, color: '#ef4444', stageType: 'lost'    },
    { key: 'VENTA_REALIZADA',       label: 'Venta realizada',            order:  8, color: '#34d399', stageType: 'open'    },
    { key: 'DOC_SOLICITADA',        label: 'Documentación solicitada',   order:  9, color: '#2dd4bf', stageType: 'open'    },
    { key: 'DOC_RECIBIDA',          label: 'Documentación recibida',     order: 10, color: '#06b6d4', stageType: 'open'    },
    { key: 'EN_VALIDACION',         label: 'En proceso de validación',   order: 11, color: '#3b82f6', stageType: 'open'    },
    { key: 'EQUIPO_ENTREGADO',      label: 'Equipo entregado',           order: 12, color: '#8b5cf6', stageType: 'open'    },
    { key: 'INSTALACION_PENDIENTE', label: 'Instalación pendiente',      order: 13, color: '#f59e0b', stageType: 'open'    },
    { key: 'INSTALACION_REALIZADA', label: 'Instalación realizada',      order: 14, color: '#84cc16', stageType: 'open'    },
    { key: 'VENTA_CERRADA',         label: 'Venta cerrada',              order: 15, color: '#10b981', stageType: 'won'     },
];

// ─── Activity Types ───────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
    { key: 'CALL',            label: 'Llamada telefónica',    pointValue: 1, dailyCap: 10 },
    { key: 'CONTACT_SUCCESS', label: 'Contacto válido',       pointValue: 2, dailyCap:  5 },
    { key: 'WHATSAPP_SENT',   label: 'WhatsApp enviado',      pointValue: 1, dailyCap: 10 },
    { key: 'EMAIL_SENT',      label: 'Correo enviado',        pointValue: 1, dailyCap:  5 },
    { key: 'VISIT',           label: 'Visita en terreno',     pointValue: 3, dailyCap:  3 },
    { key: 'VISIT_ATTENDED',  label: 'Visita atendida',       pointValue: 4, dailyCap:  3 },
    { key: 'QUOTE_SENT',      label: 'Oferta presentada',     pointValue: 3, dailyCap:  3 },
    { key: 'FOLLOWUP',        label: 'Seguimiento',           pointValue: 1, dailyCap: 10 },
    { key: 'NOTE_ADDED',      label: 'Nota/bitácora',         pointValue: 0, dailyCap:  0 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Encontrar la empresa (AWNA)
        const company = await Company.findOne({ name: /awna/i });
        if (!company) {
            console.error('❌ No se encontró empresa AWNA en la BD');
            process.exit(1);
        }
        console.log(`✅ Empresa: ${company.name} (${company._id})\n`);

        // Verificar que EQUIFAX sigue intacta (solo para confirmar, no la toca)
        const equifaxBu = await BusinessUnit.findOne({ companyId: company._id, code: 'EQUIFAX' });
        if (!equifaxBu) {
            console.error('⚠️  No se encontró BU EQUIFAX — verifica que el entorno es correcto');
            process.exit(1);
        }
        console.log(`✅ BU EQUIFAX existe y sigue intacta (${equifaxBu._id})\n`);

        // Crear o actualizar (upsert) la BU GETNET
        // findOneAndUpdate con { upsert: true } → si existe la actualiza, si no la crea.
        // En ningún caso toca otro documento.
        const getnetBu = await BusinessUnit.findOneAndUpdate(
            { companyId: company._id, code: 'GETNET' },
            {
                $set: {
                    companyId:      company._id,
                    code:           'GETNET',
                    name:           'Getnet',
                    isActive:       true,
                    leadSchema:     LEAD_SCHEMA,
                    activityTypes:  ACTIVITY_TYPES,
                    pipelineStages: PIPELINE_STAGES,
                },
            },
            { upsert: true, new: true, runValidators: true }
        );

        console.log(`✅ BU GETNET creada/actualizada: ${getnetBu._id}\n`);

        console.log(`📋 Campos del formulario: ${LEAD_SCHEMA.length}`);
        LEAD_SCHEMA.forEach((f) => console.log(`   ${f.order + 1}. ${f.label} (${f.type})`));

        console.log(`\n🎯 Etapas del pipeline: ${PIPELINE_STAGES.length}`);
        PIPELINE_STAGES.forEach((s) =>
            console.log(`   ${String(s.order + 1).padStart(2, ' ')}. [${s.stageType.toUpperCase().padEnd(7)}] ${s.label}`)
        );

        console.log(`\n📊 Tipos de actividad: ${ACTIVITY_TYPES.length}`);
        ACTIVITY_TYPES.forEach((a) =>
            console.log(`   - ${a.label.padEnd(25)} ${a.pointValue} pt(s), cap ${a.dailyCap}/día`)
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ BU GETNET lista. Equifax no fue modificada.');
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.errors) {
            Object.values(err.errors).forEach((e) => console.error('  -', e.message));
        }
        process.exit(1);
    }
}

main();
