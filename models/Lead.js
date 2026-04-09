import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

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
        teamId: {
            type: String,
        },
        ownerUserId: {
            type: String,
            required: true,
            index: true,
        },
        assignedByUserId: {
            type: String,
        },
        source: {
            type: String,
            enum: ['MANUAL', 'PRELOADED', 'IMPORT_CSV'],
        },
        status: {
            type: String,
            enum: ['OPEN', 'WON', 'LOST'],
            default: 'OPEN',
        },
        currentStageId: {
            type: Schema.Types.ObjectId,
            ref: 'FunnelStage',
            required: true,
            index: true,
        },
        lastActivityAt: {
            type: Date,
        },
        lastStageChangedAt: {
            type: Date,
        },
        nextActionAt: {
            type: Date,
        },
        nextActionType: {
            type: String,
            enum: ['CALL', 'MEETING', 'FOLLOWUP', 'DOCS'],
        },
        isDormant: {
            type: Boolean,
            default: false,
        },
        stagnationLevel: {
            type: String,
            enum: ['RISK', 'OVERDUE', 'CRITICAL'],
        },
        estimatedAmount: {
            type: Number,
        },
        closedAmount: {
            type: Number,
        },
        closedAt: {
            type: Date,
        },
        lostReason: {
            type: String,
        },
        // Cotización / portabilidad (formulario comercial)
        segment: {
            type: String,
            enum: ['MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE', 'GRANDE_1', 'CORPORACION'],
        },
        product: {
            type: String,
            enum: ['FIBRA_OPTICA', 'PLANES_MOVILES'],
        },
        contactZoneRole: {
            type: String,
            enum: ['REPRESENTANTE_LEGAL', 'GERENTE', 'OTRO'],
        },
        contactZoneRoleOther: {
            type: String,
            trim: true,
        },
        donorCompany: {
            type: String,
            trim: true,
        },
        quoteDate: {
            type: Date,
        },
        activationDate: {
            type: Date,
        },
        sigloFolio: {
            type: String,
            trim: true,
        },
        prepagoPortas: {
            type: Number,
            min: 0,
        },
        postpagoPortas: {
            type: Number,
            min: 0,
        },
        altasCount: {
            type: Number,
            min: 0,
        },
        observation: {
            type: String,
        },
        supervisorUserId: {
            type: String,
            index: true,
        },
        clientName: {
            type: String,
            trim: true,
        },
        clientRut: {
            type: String,
            trim: true,
        },
        // Campos extendidos del formulario call center
        openSubstatus: {
            type: String,
            enum: ['OPORTUNIDAD', 'EN_NEGOCIACION', 'EN_REVISION'],
        },
        wonSaleClosed: {
            type: Boolean,
            default: false,
        },
        mobileEnabled: {
            type: Boolean,
            default: false,
        },
        fixedEnabled: {
            type: Boolean,
            default: false,
        },
        mobileType: {
            type: String,
            enum: ['HABILITACION', 'PORTABILIDAD'],
        },
        mobileLines: {
            type: Number,
            min: 0,
        },
        fixedPack: {
            type: String,
            enum: ['TRIO', 'DUO', 'INDIVIDUAL'],
        },
        fixedDuoProducts: {
            type: [String],
            default: [],
        },
        fixedSingle: {
            type: String,
        },
        fixedCommune: {
            type: String,
        },
        fixedAddress: {
            type: String,
        },
        fixedMap: {
            type: String,
        },
        riskGrade: {
            type: String,
            enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        },
        riskHasProtesto: {
            type: String,
            enum: ['SI', 'NO'],
        },
        riskDicomTotal: {
            type: Number,
            min: 0,
        },
        riskDicomTelco: {
            type: Number,
            min: 0,
        },
        riskDeudaClaro: {
            type: Number,
            min: 0,
        },
        claroSegment: {
            type: String,
            enum: ['MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE', 'GRANDE_1', 'CORPORACION'],
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

leadSchema.index({ companyId: 1, businessUnitId: 1, ownerUserId: 1, status: 1 });
leadSchema.index({ companyId: 1, businessUnitId: 1, nextActionAt: 1 });
leadSchema.index({ companyId: 1, businessUnitId: 1, isDormant: 1, stagnationLevel: 1 });
leadSchema.plugin(paginate);

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
