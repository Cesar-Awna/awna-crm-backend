import connectMongoDB from '../libs/mongoose.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import AppConfig from '../models/AppConfig.js';

export default class AdminService {
    constructor() {
        connectMongoDB();
    }

    getStats = async () => {
        try {
            const [totalCompanies, activeCompanies, suspendedCompanies, totalUsers, appConfig] = await Promise.all([
                Company.countDocuments(),
                Company.countDocuments({ status: 'ACTIVE' }),
                Company.countDocuments({ status: 'SUSPENDED' }),
                User.countDocuments(),
                AppConfig.findOne(),
            ]);

            const stats = {
                totalCompanies,
                activeCompanies,
                suspendedCompanies,
                totalUsers,
                appVersion: appConfig?.appVersion || '1.0.0',
                appStatus: appConfig?.status || 'active',
                uptime: process.uptime(),
                nodeVersion: process.version,
            };

            return { success: true, message: 'Platform stats retrieved successfully', data: stats };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving platform stats' };
        }
    };
}
