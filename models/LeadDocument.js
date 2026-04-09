import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const leadDocumentSchema = new Schema(
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
        leadId: {
            type: Schema.Types.ObjectId,
            ref: 'Lead',
            required: true,
            index: true,
        },
        docType: {
            type: String,
            enum: [
                'CONTRACT',
                'RUT_COMPANY',
                'ID_LEGAL_REP',
                'POWER_OF_ATTORNEY',
                'OTHER',
            ],
        },
        fileUrl: {
            type: String,
            required: true,
        },
        storageProvider: {
            type: String,
            enum: ['LOCAL', 'CLOUDINARY'],
            default: 'LOCAL',
        },
        storageBucket: {
            type: String,
        },
        storageKey: {
            type: String,
            index: true,
        },
        /** Versión de Cloudinary (obligatoria para URLs firmadas de type authenticated con public_id con /) */
        cloudinaryVersion: {
            type: Number,
        },
        mimeType: {
            type: String,
        },
        sizeBytes: {
            type: Number,
        },
        uploadedByUserId: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

leadDocumentSchema.plugin(paginate);

const LeadDocument = mongoose.model('LeadDocument', leadDocumentSchema);

export default LeadDocument;
