import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const userRoleSchema = new Schema(
    {
        companyId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        roleName: {
            type: String,
            enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE'],
            required: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

userRoleSchema.plugin(paginate);

const UserRole = mongoose.model('UserRole', userRoleSchema);

export default UserRole;
