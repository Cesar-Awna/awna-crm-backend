import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const productSchema = new Schema(
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
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
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

productSchema.plugin(paginate);

const Product = mongoose.model('Product', productSchema);

export default Product;
