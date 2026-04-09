import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const planSchema = new Schema(
    {
        name: { type: String, trim: true },
        userLimit: { type: Number },
        storageLimitGb: { type: Number },
    },
    { _id: false }
);

const companySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        rut: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'SUSPENDED'],
            default: 'ACTIVE',
        },
        plan: {
            type: planSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

companySchema.plugin(paginate);

const Company = mongoose.model('Company', companySchema);

export default Company;
