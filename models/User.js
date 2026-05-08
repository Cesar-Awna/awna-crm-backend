import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        companyId: {
            type: String,
            required: false,
            default: null,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        phone: {
            type: String,
        },
        passwordHash: {
            type: String,
        },
        firebaseUid: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        businessUnitIds: {
            type: [String],
            default: undefined,
        },
        teamId: {
            type: String,
            default: undefined,
        },
        supervisorId: {
            type: String,
            default: null,
            index: true,
        },
        roleName: {
            type: String,
            enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE'],
            default: 'EXECUTIVE',
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });
userSchema.index({ companyId: 1, roleName: 1 });
userSchema.index({ companyId: 1, supervisorId: 1, roleName: 1 });
userSchema.plugin(paginate);

const User = mongoose.model('User', userSchema);

export default User;
