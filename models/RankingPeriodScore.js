import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const rankingPeriodScoreSchema = new Schema(
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
        periodType: {
            type: String,
            enum: ['WEEK', 'MONTH'],
        },
        periodStart: {
            type: Date,
        },
        periodEnd: {
            type: Date,
        },
        userId: {
            type: String,
            required: true,
        },
        activityScore: {
            type: Number,
        },
        progressScore: {
            type: Number,
        },
        resultScore: {
            type: Number,
        },
        totalScore: {
            type: Number,
        },
        computedAt: {
            type: Date,
            default: Date.now,
        },
        kpisSnapshot: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

rankingPeriodScoreSchema.index({
    companyId: 1,
    businessUnitId: 1,
    periodType: 1,
    periodStart: 1,
    userId: 1,
});
rankingPeriodScoreSchema.plugin(paginate);

const RankingPeriodScore = mongoose.model(
    'RankingPeriodScore',
    rankingPeriodScoreSchema
);

export default RankingPeriodScore;
