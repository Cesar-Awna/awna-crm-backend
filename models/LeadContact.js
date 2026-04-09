import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const leadContactSchema = new Schema(
    {
        companyId: {
            type: String,
            required: true,
            index: true,
        },
        leadId: {
            type: Schema.Types.ObjectId,
            ref: 'Lead',
            required: true,
            index: true,
        },
        contactName: {
            type: String,
            required: true,
        },
        contactRole: {
            type: String,
        },
        contactPhone: {
            type: String,
        },
        contactEmail: {
            type: String,
        },
        legalRepName: {
            type: String,
        },
        legalRepRut: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

leadContactSchema.plugin(paginate);

const LeadContact = mongoose.model('LeadContact', leadContactSchema);

export default LeadContact;
