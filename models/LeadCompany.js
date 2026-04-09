import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const leadCompanySchema = new Schema(
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
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        companyRut: {
            type: String,
            trim: true,
            index: true,
        },
        address: {
            type: String,
        },
        comuna: {
            type: String,
        },
        region: {
            type: String,
        },
        industry: {
            type: String,
        },
        companySize: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

leadCompanySchema.index({ companyId: 1, companyRut: 1 });
leadCompanySchema.index({ companyId: 1, companyName: 'text' });
leadCompanySchema.plugin(paginate);

const LeadCompany = mongoose.model('LeadCompany', leadCompanySchema);

export default LeadCompany;
