import connectMongoDB from '../libs/mongoose.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

export default class AuthService {
    constructor() {
        connectMongoDB();
    }

    login = async (req) => {
        try {
            const { email, password } = req.body || {};

            if (!email || !password) {
                return {
                    success: false,
                    message: 'Email and password are required',
                };
            }

            const user = await User.findOne({ email }).lean();

            if (!user || !user.passwordHash || user.passwordHash !== password) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }

            const session = {
                userId: String(user._id),
                companyId: user.companyId,
                roleName: user.roleName || null,
                businessUnitIds: user.businessUnitIds || [],
                teamId: user.teamId || null,
                supervisorId: user.supervisorId || null,
            };

            if (!JWT_SECRET) {
                console.error('❌ JWT_SECRET is not defined');
                return {
                    success: false,
                    message: 'Server configuration error',
                };
            }

            const accessToken = jwt.sign(
                {
                    id: session.userId,
                    companyId: session.companyId,
                    role: session.roleName,
                    businessUnitIds: session.businessUnitIds,
                    teamId: session.teamId,
                    supervisorId: session.supervisorId,
                },
                JWT_SECRET,
                { expiresIn: '1d' }
            );

            const refreshToken = jwt.sign(
                {
                    id: session.userId,
                    type: 'refresh',
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    session,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Unexpected service error during login',
            };
        }
    };

    refresh = async (req) => {
        try {
            const { refreshToken } = req.body || {};

            if (!refreshToken) {
                return {
                    success: false,
                    message: 'Refresh token is required',
                };
            }

            const newAccessToken = `access-refreshed-${Date.now()}`;

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Unexpected service error during refresh',
            };
        }
    };

    logout = async () => {
        try {
            return {
                success: true,
                message: 'Logout successful',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Unexpected service error during logout',
            };
        }
    };

    me = async (req) => {
        try {
            const userId =
                req.user?.id || req.user?._id || req.query.userId || req.params.id;

            if (!userId) {
                return {
                    success: false,
                    message: 'User context not provided',
                };
            }

            const user = await User.findById(userId).lean();

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            return {
                success: true,
                message: 'User profile retrieved successfully',
                data: {
                    user: {
                        _id: user._id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        companyId: user.companyId,
                        isActive: user.isActive,
                        businessUnitIds: user.businessUnitIds || [],
                        teamId: user.teamId,
                        createdAt: user.createdAt,
                    },
                    role: user.roleName || null,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Unexpected service error retrieving profile',
            };
        }
    };

    updateProfile = async (req) => {
        try {
            const userId = req.user?.id || req.user?._id;

            if (!userId) {
                return {
                    success: false,
                    message: 'User context not provided',
                };
            }

            const { fullName, phone } = req.body || {};
            const updates = {};

            if (fullName !== undefined) updates.fullName = fullName.trim();
            if (phone !== undefined) updates.phone = phone.trim();

            if (Object.keys(updates).length === 0) {
                return {
                    success: false,
                    message: 'No fields to update',
                };
            }

            const user = await User.findByIdAndUpdate(userId, updates, {
                new: true,
                lean: true,
            });

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            return {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        _id: user._id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                    },
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating profile',
            };
        }
    };

    changePassword = async (req) => {
        try {
            const userId = req.user?.id || req.user?._id;

            if (!userId) {
                return {
                    success: false,
                    message: 'User context not provided',
                };
            }

            const { currentPassword, newPassword } = req.body || {};

            if (!currentPassword || !newPassword) {
                return {
                    success: false,
                    message: 'Current and new password are required',
                };
            }

            if (newPassword.length < 6) {
                return {
                    success: false,
                    message: 'New password must be at least 6 characters',
                };
            }

            const user = await User.findById(userId).lean();

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            if (user.passwordHash !== currentPassword) {
                return {
                    success: false,
                    message: 'Current password is incorrect',
                };
            }

            await User.findByIdAndUpdate(userId, { passwordHash: newPassword });

            return {
                success: true,
                message: 'Password changed successfully',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error changing password',
            };
        }
    };
}
