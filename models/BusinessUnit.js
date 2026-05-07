import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const leadFieldSchema = new Schema({
    key:         { type: String, required: true },
    label:       { type: String, required: true },
    type:        { type: String, enum: ['text', 'number', 'email', 'phone', 'select', 'date', 'textarea'], default: 'text' },
    required:    { type: Boolean, default: false },
    options:     [String],
    placeholder: String,
    order:       { type: Number, default: 0 },
}, { _id: false });

const activityTypeSchema = new Schema({
    key:        { type: String, required: true },
    label:      { type: String, required: true },
    pointValue: { type: Number, default: 1 },
    dailyCap:   { type: Number, default: 10 },
}, { _id: false });

const pipelineStageSchema = new Schema({
    key:       { type: String, required: true },
    label:     { type: String, required: true },
    order:     { type: Number, default: 0 },
    color:     String,
    stageType: { type: String, enum: ['open', 'won', 'lost', 'invalid'], default: 'open' },
}, { _id: false });

const businessUnitSchema = new Schema(
    {
        companyId:      { type: String, required: true, index: true },
        code:           { type: String, required: true },
        name:           { type: String, required: true },
        isActive:       { type: Boolean, default: true },
        leadSchema:     { type: [leadFieldSchema], default: [] },
        activityTypes:  { type: [activityTypeSchema], default: [] },
        pipelineStages: { type: [pipelineStageSchema], default: [] },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

businessUnitSchema.index({ companyId: 1, code: 1 }, { unique: true });
businessUnitSchema.plugin(paginate);

const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);

export default BusinessUnit;
