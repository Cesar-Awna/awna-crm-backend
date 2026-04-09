import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const businessUnitSchema = new Schema(
    {
        companyId: {
            type: String,
            required: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

businessUnitSchema.index({ companyId: 1, code: 1 }, { unique: true });
businessUnitSchema.plugin(paginate);

const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);

export default BusinessUnit;
