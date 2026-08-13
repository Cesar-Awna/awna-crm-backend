import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const ticketSchema = new Schema(
    {
        companyId: {
            type: String,
            required: true,
            index: true,
        },
        businessUnitId: {
            type: Schema.Types.ObjectId,
            ref: 'BusinessUnit',
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userFullName: {
            type: String,
        },
        type: {
            type: String,
            enum: [
                'ERROR_SISTEMA',
                'DUDA_USO',
                'SUGERENCIA',
                'PROBLEMA_LEADS',
                'PROBLEMA_ACCESO',
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        evidenceUrl: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['ABIERTO', 'EN_REVISION', 'RESUELTO'],
            default: 'ABIERTO',
            index: true,
        },
        response: {
            type: String,
            trim: true,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedByUserId: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

ticketSchema.index({ companyId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.plugin(paginate);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
