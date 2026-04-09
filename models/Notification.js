import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const notificationSchema = new Schema(
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
        type: {
            type: String,
            enum: [
                'MEETING_TODAY',
                'MEETING_24H',
                'LEAD_DORMANT',
                'LEAD_STAGNATION_CRITICAL',
            ],
        },
        title: {
            type: String,
        },
        body: {
            type: String,
        },
        leadId: {
            type: String,
        },
        readAt: {
            type: Date,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

notificationSchema.index({ companyId: 1, userId: 1, readAt: 1 });
notificationSchema.plugin(paginate);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
