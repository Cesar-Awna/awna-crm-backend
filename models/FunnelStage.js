import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const funnelStageSchema = new Schema(
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
        stageOrder: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        isFinal: {
            type: Boolean,
            default: false,
        },
        finalType: {
            type: String,
            enum: ['WON', 'LOST'],
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

funnelStageSchema.index({ companyId: 1, businessUnitId: 1, stageOrder: 1 });
funnelStageSchema.plugin(paginate);

const FunnelStage = mongoose.model('FunnelStage', funnelStageSchema);

export default FunnelStage;
