import connectMongoDB from '../libs/mongoose.js';
import RankingPeriodScore from '../models/RankingPeriodScore.js';

export default class RankingService {
    constructor() {
        connectMongoDB();
    }

    getWeekly = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const role = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { periodType: 'WEEK', companyId };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const data = await RankingPeriodScore.find(filter)
                .sort({ periodStart: -1, totalScore: -1 })
                .lean();
            return {
                success: true,
                message: 'Weekly ranking retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving weekly ranking' };
        }
    };

    getMonthly = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const role = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { periodType: 'MONTH', companyId };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const data = await RankingPeriodScore.find(filter)
                .sort({ periodStart: -1, totalScore: -1 })
                .lean();
            return {
                success: true,
                message: 'Monthly ranking retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving monthly ranking' };
        }
    };

    getMe = async (req) => {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return { success: false, message: 'User context required' };
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const { periodType } = req.query || {};
            const filter = { userId: String(userId), companyId, businessUnitId };
            if (periodType) filter.periodType = periodType;
            const data = await RankingPeriodScore.find(filter)
                .sort({ periodStart: -1 })
                .lean();
            return {
                success: true,
                message: 'My ranking retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving my ranking' };
        }
    };

    getByUser = async (req) => {
        try {
            const { userId } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const { periodType } = req.query || {};
            const filter = { userId: String(userId), companyId, businessUnitId };
            if (periodType) filter.periodType = periodType;
            const data = await RankingPeriodScore.find(filter)
                .sort({ periodStart: -1 })
                .lean();
            return {
                success: true,
                message: 'User ranking retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving user ranking' };
        }
    };
}
