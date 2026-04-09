import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const slaStageRuleSchema = new Schema(
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
        stageId: {
            type: Schema.Types.ObjectId,
            ref: 'FunnelStage',
            required: true,
            index: true,
        },
        maxDaysWithoutStageChange: {
            type: Number,
            required: true,
        },
        maxDaysWithoutActivity: {
            type: Number,
            required: true,
        },
        riskThresholdPct: {
            type: Number,
            default: 80,
        },
        criticalThresholdPct: {
            type: Number,
            default: 150,
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

slaStageRuleSchema.plugin(paginate);

const SlaStageRule = mongoose.model('SlaStageRule', slaStageRuleSchema);

export default SlaStageRule;
