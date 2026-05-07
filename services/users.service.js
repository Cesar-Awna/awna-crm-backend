import connectMongoDB from '../libs/mongoose.js';
import User from '../models/User.js';
import { parsePaginationParams, formatPaginatedResponse, formatPaginationError } from '../utils/pagination.js';

export default class UsersService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || null;
            }
            if (!companyId) {
                return formatPaginationError('Company context required');
            }

            const { page, limit, sort } = parsePaginationParams(req);
            const filter = { companyId };

            const result = await User.paginate(filter, {
                page,
                limit,
                sort,
                lean: true,
            });

            return {
                ...formatPaginatedResponse(result),
                message: 'Users retrieved successfully',
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return formatPaginationError('Error retrieving users');
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body?.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await User.findOne({ _id: id, companyId }).lean();
            if (!data) {
                return { success: false, message: 'User not found' };
            }
            return {
                success: true,
                message: 'User retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving user',
            };
        }
    };

    create = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.body.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const payload = { ...req.body, companyId };
            if (payload.password && !payload.passwordHash) {
                payload.passwordHash = payload.password;
                delete payload.password;
            }
            const data = await User.create(payload);
            return {
                success: true,
                message: 'User created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating user',
            };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await User.findOneAndUpdate(
                { _id: id, companyId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) {
                return { success: false, message: 'User not found' };
            }
            return {
                success: true,
                message: 'User updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating user',
            };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body?.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await User.findOneAndDelete({ _id: id, companyId }).lean();
            if (!data) {
                return { success: false, message: 'User not found' };
            }
            return {
                success: true,
                message: 'User deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting user',
            };
        }
    };

    assignRole = async (req) => {
        try {
            const { id } = req.params;
            const { roleName } = req.body || {};
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.body.companyId || req.query.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            if (!roleName) {
                return { success: false, message: 'roleName is required' };
            }
            const user = await User.findOneAndUpdate(
                { _id: id, companyId },
                { roleName },
                { new: true, lean: true }
            );
            if (!user) return { success: false, message: 'User not found' };
            return {
                success: true,
                message: 'Role assigned successfully',
                data: user,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error assigning role' };
        }
    };

    assignBusinessUnits = async (req) => {
        try {
            const { id } = req.params;
            const { businessUnitIds } = req.body || {};
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.body.companyId || req.query.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const user = await User.findOneAndUpdate(
                { _id: id, companyId },
                { businessUnitIds: Array.isArray(businessUnitIds) ? businessUnitIds : [] },
                { new: true, lean: true }
            );
            if (!user) return { success: false, message: 'User not found' };
            return {
                success: true,
                message: 'Business units assigned successfully',
                data: user,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error assigning business units' };
        }
    };

    assignTeam = async (req) => {
        try {
            const { id } = req.params;
            const { teamId } = req.body || {};
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.body.companyId || req.query.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const user = await User.findOneAndUpdate(
                { _id: id, companyId },
                { teamId: teamId || null },
                { new: true, lean: true }
            );
            if (!user) return { success: false, message: 'User not found' };
            return {
                success: true,
                message: 'Team assigned successfully',
                data: user,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error assigning team' };
        }
    };

    getExecutives = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || null;
            }
            if (!companyId) return formatPaginationError('Company context required');

            const { page, limit, sort } = parsePaginationParams(req);
            const result = await User.paginate(
                { companyId, roleName: 'EXECUTIVE' },
                { page, limit, sort, lean: true }
            );

            return {
                ...formatPaginatedResponse(result),
                message: 'Executives retrieved successfully',
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return formatPaginationError('Error retrieving executives');
        }
    };

    getSupervisors = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || null;
            }
            if (!companyId) return formatPaginationError('Company context required');

            const { page, limit, sort } = parsePaginationParams(req);
            const result = await User.paginate(
                { companyId, roleName: 'SUPERVISOR' },
                { page, limit, sort, lean: true }
            );

            return {
                ...formatPaginatedResponse(result),
                message: 'Supervisors retrieved successfully',
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return formatPaginationError('Error retrieving supervisors');
        }
    };

    changePassword = async (req) => {
        try {
            const userId = req.user?._id;
            const { currentPassword, newPassword } = req.body || {};

            if (!userId) {
                return { success: false, message: 'User context required' };
            }

            if (!currentPassword || !newPassword) {
                return { success: false, message: 'Current and new password are required' };
            }

            if (newPassword.length < 6) {
                return { success: false, message: 'New password must be at least 6 characters' };
            }

            const user = await User.findById(userId).lean();
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (user.passwordHash !== currentPassword) {
                return { success: false, message: 'Current password is incorrect' };
            }

            const updated = await User.findByIdAndUpdate(
                userId,
                { passwordHash: newPassword },
                { new: true, lean: true }
            );

            return {
                success: true,
                message: 'Password changed successfully',
                data: { _id: updated._id, email: updated.email },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error changing password' };
        }
    };
}
