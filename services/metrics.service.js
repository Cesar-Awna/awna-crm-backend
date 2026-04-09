import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import RankingPeriodScore from '../models/RankingPeriodScore.js';

export default class MetricsService {
    constructor() {
        connectMongoDB();
    }

    getExecutiveMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { companyId, businessUnitId };
            const userId = req.user?.id || req.user?._id;
            if (userId) filter.ownerUserId = userId;
            const [openCount, wonCount, lostCount] = await Promise.all([
                Lead.countDocuments({ ...filter, status: 'OPEN' }),
                Lead.countDocuments({ ...filter, status: 'WON' }),
                Lead.countDocuments({ ...filter, status: 'LOST' }),
            ]);
            const data = {
                openLeads: openCount,
                wonLeads: wonCount,
                lostLeads: lostCount,
                totalLeads: openCount + wonCount + lostCount,
            };
            return { success: true, message: 'Executive metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving executive metrics' };
        }
    };

    getMyMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const userId = req.user?.id || req.user?._id;

            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!userId) {
                return { success: false, message: 'User context required' };
            }

            const filter = { companyId, businessUnitId, ownerUserId: userId };

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const startOfWeek = new Date();
            const dayOfWeek = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const [
                openCount,
                wonCount,
                lostCount,
                wonThisMonth,
                lostThisMonth,
                wonThisWeek,
                totalAmount,
                dueToday,
                overdue,
                byStage,
                eventsThisWeek,
                rankingData,
            ] = await Promise.all([
                Lead.countDocuments({ ...filter, status: 'OPEN' }),
                Lead.countDocuments({ ...filter, status: 'WON' }),
                Lead.countDocuments({ ...filter, status: 'LOST' }),
                Lead.countDocuments({ ...filter, status: 'WON', closedAt: { $gte: startOfMonth } }),
                Lead.countDocuments({ ...filter, status: 'LOST', closedAt: { $gte: startOfMonth } }),
                Lead.countDocuments({ ...filter, status: 'WON', closedAt: { $gte: startOfWeek } }),
                Lead.aggregate([
                    { $match: { ...filter, status: 'WON', closedAt: { $gte: startOfMonth } } },
                    { $group: { _id: null, total: { $sum: '$estimatedAmount' } } },
                ]),
                Lead.countDocuments({ ...filter, status: 'OPEN', nextActionAt: { $gte: startOfDay, $lte: endOfDay } }),
                Lead.countDocuments({ ...filter, status: 'OPEN', nextActionAt: { $lt: startOfDay } }),
                Lead.aggregate([
                    { $match: { ...filter, status: 'OPEN' } },
                    { $group: { _id: '$currentStageId', count: { $sum: 1 } } },
                ]),
                LeadEvent.countDocuments({ companyId, businessUnitId, userId: String(userId), createdAt: { $gte: startOfWeek } }),
                RankingPeriodScore.findOne({ userId: String(userId), companyId, businessUnitId, periodType: 'MONTH' }).sort({ periodStart: -1 }).lean(),
            ]);

            const closed = wonCount + lostCount;
            const conversionRate = closed > 0 ? Math.round((wonCount / closed) * 100) : 0;

            const data = {
                openLeads: openCount,
                wonLeads: wonCount,
                lostLeads: lostCount,
                totalLeads: openCount + wonCount + lostCount,
                wonThisMonth,
                lostThisMonth,
                wonThisWeek,
                totalAmountThisMonth: totalAmount[0]?.total || 0,
                conversionRatePct: conversionRate,
                dueToday,
                overdue,
                byStage,
                eventsThisWeek,
                currentRanking: rankingData || null,
            };

            return { success: true, message: 'My metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving my metrics' };
        }
    };

    getSupervisorMetrics = async (req) => {
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

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const byStatus = await Lead.aggregate([
                { $match: filter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            const data = {
                byStatus: byStatus.reduce((acc, x) => ({ ...acc, [x._id]: x.count }), {}),
            };
            return { success: true, message: 'Supervisor metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving supervisor metrics' };
        }
    };

    getConversionMetrics = async (req) => {
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

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const [won, lost, open] = await Promise.all([
                Lead.countDocuments({ ...filter, status: 'WON' }),
                Lead.countDocuments({ ...filter, status: 'LOST' }),
                Lead.countDocuments({ ...filter, status: 'OPEN' }),
            ]);
            const total = won + lost + open;
            const closed = won + lost;
            const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
            const data = {
                won,
                lost,
                open,
                total,
                conversionRatePct: conversionRate,
            };
            return { success: true, message: 'Conversion metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving conversion metrics' };
        }
    };

    getFunnelMetrics = async (req) => {
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

            const filter = { status: 'OPEN', companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const byStage = await Lead.aggregate([
                { $match: filter },
                { $group: { _id: '$currentStageId', count: { $sum: 1 } } },
            ]);
            const data = { byStage };
            return { success: true, message: 'Funnel metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving funnel metrics' };
        }
    };

    getSummaryMetrics = async (req) => {
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

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const [open, won, lost, eventCount] = await Promise.all([
                Lead.countDocuments({ ...filter, status: 'OPEN' }),
                Lead.countDocuments({ ...filter, status: 'WON' }),
                Lead.countDocuments({ ...filter, status: 'LOST' }),
                LeadEvent.countDocuments(filter),
            ]);
            const data = {
                openLeads: open,
                wonLeads: won,
                lostLeads: lost,
                totalEvents: eventCount,
            };
            return { success: true, message: 'Summary metrics retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving summary metrics' };
        }
    };
}
