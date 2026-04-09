import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const leadEventSchema = new Schema(
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
        userId: {
            type: String,
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            enum: [
                'CONTACT_ATTEMPT',
                'CONTACT_SUCCESS',
                'MEETING_SCHEDULED',
                'MEETING_DONE',
                'PROPOSAL_SENT',
                'DOC_REQUESTED',
                'DOC_UPLOADED',
                'STAGE_CHANGED',
                'WON',
                'LOST',
                'NOTE_ADDED',
            ],
            required: true,
        },
        eventAt: {
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

leadEventSchema.index({ companyId: 1, leadId: 1, eventAt: -1 });
leadEventSchema.index({ companyId: 1, businessUnitId: 1, userId: 1, eventAt: -1 });
leadEventSchema.plugin(paginate);

const LeadEvent = mongoose.model('LeadEvent', leadEventSchema);

export default LeadEvent;
