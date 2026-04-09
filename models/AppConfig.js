import mongoose from 'mongoose';

const { Schema } = mongoose;

const appConfigSchema = new Schema(
    {
        status: {
            type: String,
            default: 'active',
            trim: true,
        },
        appVersion: {
            type: String,
            default: '1.0.0',
            trim: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

const AppConfig = mongoose.model('AppConfig', appConfigSchema, 'appconfig');

export default AppConfig;
