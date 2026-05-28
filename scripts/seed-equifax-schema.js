import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BusinessUnit from '../models/BusinessUnit.js';

dotenv.config();

const LEAD_SCHEMA = [
  { key: 'razonSocial',         label: 'Razón Social',          type: 'text',     required: true,  placeholder: 'Empresa S.A.',             order: 0 },
  { key: 'rutEmpresa',          label: 'RUT Empresa',           type: 'text',     required: true,  placeholder: '76.123.456-7',             order: 1 },
  { key: 'contactName',         label: 'Nombre del Contacto',   type: 'text',     required: true,  placeholder: 'Juan Pérez',               order: 2 },
  { key: 'contactPhone',        label: 'Teléfono',              type: 'phone',    required: false, placeholder: '+56 9 1234 5678',          order: 3 },
  { key: 'contactEmail',        label: 'Correo',                type: 'email',    required: false, placeholder: 'contacto@empresa.cl',      order: 4 },
  { key: 'productoCotizado',    label: 'Producto cotizado',     type: 'select',   required: false, options: ['Mora Control', 'Reporte Interactivo'], order: 5 },
  { key: 'valorEsperado',       label: 'Valor esperado',        type: 'number',   required: false, placeholder: '0',                        order: 6 },
  { key: 'monedaValorEsperado', label: 'Moneda',                type: 'select',   required: false, options: ['UF', 'CLP'],                  order: 7 },
  { key: 'segmentacion',        label: 'Segmentación',          type: 'select',   required: false, options: ['Industria', 'Segmento'],      order: 8 },
  { key: 'fuenteLead',          label: 'Fuente de lead',        type: 'select',   required: false, options: ['Ads', 'Apolo', 'Referido', 'Otro'], order: 9 },
  { key: 'observation',         label: 'Observación',           type: 'textarea', required: false, placeholder: 'Notas u observaciones…',   order: 10 },
];

const ACTIVITY_TYPES = [
  { key: 'CALL',            label: 'Llamada realizada',   pointValue: 1, dailyCap: 10 },
  { key: 'CONTACT_SUCCESS', label: 'Contacto efectivo',   pointValue: 2, dailyCap: 5  },
  { key: 'FOLLOWUP',        label: 'Seguimiento',         pointValue: 1, dailyCap: 10 },
  { key: 'WHATSAPP_SENT',   label: 'WhatsApp enviado',    pointValue: 1, dailyCap: 10 },
  { key: 'EMAIL_SENT',      label: 'Correo enviado',      pointValue: 1, dailyCap: 5  },
  { key: 'QUOTE_SENT',      label: 'Cotización enviada',  pointValue: 3, dailyCap: 3  },
  { key: 'RESCHEDULE',      label: 'Reagendamiento',      pointValue: 1, dailyCap: 5  },
  { key: 'NOTE_ADDED',      label: 'Nota/hito',           pointValue: 0, dailyCap: 0  },
];

const PIPELINE_STAGES = [
  { key: 'NUEVO',              label: 'Nuevo',              order: 0,  color: '#38bdf8', stageType: 'open' },
  { key: 'CONTACTADO',         label: 'Contactado',         order: 1,  color: '#60a5fa', stageType: 'open' },
  { key: 'INTERESADO',         label: 'Interesado',         order: 2,  color: '#a78bfa', stageType: 'open' },
  { key: 'COTIZACION_ENVIADA', label: 'Cotización enviada', order: 3,  color: '#fbbf24', stageType: 'open' },
  { key: 'EN_SEGUIMIENTO',     label: 'En seguimiento',     order: 4,  color: '#fb923c', stageType: 'open' },
  { key: 'CERRADO_GANADO',     label: 'Cerrado ganado',     order: 5,  color: '#34d399', stageType: 'won' },
  { key: 'CLIENTE',            label: 'Cliente',            order: 6,  color: '#059669', stageType: 'won' },
  { key: 'CERRADO_PERDIDO',    label: 'Cerrado perdido',    order: 7,  color: '#f87171', stageType: 'lost' },
  { key: 'NO_INTERESADO',      label: 'No interesado',      order: 8,  color: '#fb7185', stageType: 'lost' },
  { key: 'DATO_ERRADO',        label: 'Dato errado',        order: 9,  color: '#94a3b8', stageType: 'invalid' },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Conectado a MongoDB');

  const bu = await BusinessUnit.findOne({ name: /equifax/i });
  if (!bu) {
    console.error('❌ No se encontró la BU Equifax');
    process.exit(1);
  }

  console.log(`📋 BU encontrada: ${bu.name} (${bu._id})`);

  bu.leadSchema     = LEAD_SCHEMA;
  bu.activityTypes  = ACTIVITY_TYPES;
  bu.pipelineStages = PIPELINE_STAGES;
  await bu.save();

  console.log('✅ Schema de Equifax actualizado:');
  console.log(`   leadSchema:     ${bu.leadSchema.length} campos`);
  console.log(`   activityTypes:  ${bu.activityTypes.length} tipos`);
  console.log(`   pipelineStages: ${bu.pipelineStages.length} etapas`);

  await mongoose.disconnect();
  console.log('✅ Listo.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
