import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

export const LEAD_STATUSES = [
    'NUEVO',
    'DATO_ERRADO',
    'CONTACTADO',
    'INTERESADO',
    'COTIZACION_ENVIADA',
    'EN_SEGUIMIENTO',
    'CERRADO_GANADO',
    'CERRADO_PERDIDO',
];

const leadSchema = new Schema(
    {
        companyId: {
            type: String,
            required: true,
            index: true,
        },
        businessUnitId: {
            type: Schema.Types.ObjectId,
            ref: 'BusinessUnit',
            required: true,
            index: true,
        },
        ownerUserId: {
            type: String,
            index: true,
        },
        assignedByUserId: {
            type: String,
        },
        razonSocial: {
            type: String,
            trim: true,
        },
        rutEmpresa: {
            type: String,
            trim: true,
        },
        contactName: {
            type: String,
            trim: true,
        },
        contactEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        contactPhone: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            default: 'NUEVO',
            enum: LEAD_STATUSES,
            index: true,
        },
        observation: {
            type: String,
        },
        nextContactDate: {
            type: Date,
            index: true,
        },
        nextActionType: {
            type: String,
            enum: ['LLAMADA', 'ENVIAR_INFO', 'REUNION', 'NOTA'],
        },
        callCount:            { type: Number, default: 0 },
        contactSuccessCount:  { type: Number, default: 0 },
        followupCount:        { type: Number, default: 0 },
        whatsappSentCount:    { type: Number, default: 0 },
        emailSentCount:       { type: Number, default: 0 },
        quoteSentCount:       { type: Number, default: 0 },
        rescheduleCount:      { type: Number, default: 0 },
        activityCounts:       { type: Map, of: Number, default: {} },
        fields:               { type: Map, of: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

leadSchema.index({ companyId: 1, businessUnitId: 1, ownerUserId: 1, status: 1 });
leadSchema.index({ companyId: 1, businessUnitId: 1, status: 1, createdAt: -1 });
leadSchema.plugin(paginate);

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
