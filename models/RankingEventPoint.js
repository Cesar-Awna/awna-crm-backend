import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const rankingEventPointSchema = new Schema(
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
        eventType: {
            type: String,
            required: true,
        },
        points: {
            type: Number,
            required: true,
        },
        dailyCap: {
            type: Number,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

rankingEventPointSchema.index(
    { companyId: 1, businessUnitId: 1, eventType: 1 },
    { unique: true }
);
rankingEventPointSchema.plugin(paginate);

const RankingEventPoint = mongoose.model(
    'RankingEventPoint',
    rankingEventPointSchema
);

export default RankingEventPoint;
