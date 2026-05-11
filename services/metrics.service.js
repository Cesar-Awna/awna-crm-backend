import connectMongoDB from '../libs/mongoose.js';
import Lead, { LEAD_STATUSES } from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import RankingPeriodScore from '../models/RankingPeriodScore.js';
import BusinessUnit from '../models/BusinessUnit.js';
import { getStageInfo } from '../utils/stageInfo.js';

const DEFAULT_ACTIVITY_TYPES = [
    { key: 'CALL',            label: 'Llamada realizada' },
    { key: 'CONTACT_SUCCESS', label: 'Contacto efectivo' },
    { key: 'FOLLOWUP',        label: 'Seguimiento realizado' },
    { key: 'WHATSAPP_SENT',   label: 'WhatsApp enviado' },
    { key: 'EMAIL_SENT',      label: 'Correo enviado' },
    { key: 'QUOTE_SENT',      label: 'Cotización enviada' },
    { key: 'RESCHEDULE',      label: 'Reagendamiento' },
    { key: 'NOTE_ADDED',      label: 'Nota' },
];

const countsByStatus = async (baseFilter, statusKeys) => {
    const entries = await Promise.all(
        statusKeys.map((s) =>
            Lead.countDocuments({ ...baseFilter, status: s }).then((n) => [s, n])
        )
    );
    return Object.fromEntries(entries);
};

const sumKeys = (obj, keys) => keys.reduce((acc, k) => acc + (obj[k] || 0), 0);

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

            const { statusKeys, wonKeys, lostKeys, closedKeys } = await getStageInfo(businessUnitId);
            const byStatus  = await countsByStatus(filter, statusKeys);
            const openLeads = sumKeys(byStatus, statusKeys.filter((k) => !closedKeys.includes(k)));
            const wonLeads  = sumKeys(byStatus, wonKeys);
            const lostLeads = sumKeys(byStatus, lostKeys);
            const totalLeads = Object.values(byStatus).reduce((a, b) => a + b, 0);

            return {
                success: true,
                message: 'Executive metrics retrieved',
                data: { openLeads, wonLeads, lostLeads, totalLeads, byStatus },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving executive metrics' };
        }
    };

    getMyMetrics = async (req) => {
        try {
            const companyId    = req.companyId;
            const businessUnitId = req.businessUnitId;
            const userId       = req.user?.id || req.user?._id;

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
            const dayOfWeek   = startOfWeek.getDay();
            const diff        = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);

            const { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys } =
                await getStageInfo(businessUnitId);

            const [byStatus, wonThisMonth, lostThisMonth, wonThisWeek, eventsThisWeek, rankingData] =
                await Promise.all([
                    countsByStatus(filter, statusKeys),
                    Lead.countDocuments({ ...filter, status: { $in: wonKeys },  updatedAt: { $gte: startOfMonth } }),
                    Lead.countDocuments({ ...filter, status: { $in: lostKeys }, updatedAt: { $gte: startOfMonth } }),
                    Lead.countDocuments({ ...filter, status: { $in: wonKeys },  updatedAt: { $gte: startOfWeek } }),
                    LeadEvent.countDocuments({ companyId, businessUnitId, userId: String(userId), createdAt: { $gte: startOfWeek } }),
                    RankingPeriodScore.findOne({ userId: String(userId), companyId, businessUnitId, periodType: 'MONTH' })
                        .sort({ periodStart: -1 })
                        .lean(),
                ]);

            const openLeads     = sumKeys(byStatus, statusKeys.filter((k) => !closedKeys.includes(k)));
            const wonLeads      = sumKeys(byStatus, wonKeys);
            const lostLeads     = sumKeys(byStatus, lostKeys);
            const invalidLeads  = sumKeys(byStatus, invalidKeys);
            const closed        = wonLeads + lostLeads;
            const conversionRate = closed > 0 ? Math.round((wonLeads / closed) * 100) : 0;

            return {
                success: true,
                message: 'My metrics retrieved',
                data: {
                    openLeads,
                    wonLeads,
                    lostLeads,
                    invalidLeads,
                    totalLeads: openLeads + wonLeads + lostLeads + invalidLeads,
                    wonThisMonth,
                    lostThisMonth,
                    wonThisWeek,
                    conversionRatePct: conversionRate,
                    byStatus,
                    eventsThisWeek,
                    currentRanking: rankingData || null,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving my metrics' };
        }
    };

    getSupervisorMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const role      = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }

            // SUPERVISOR can only see metrics from their assigned business unit
            let businessUnitId = req.businessUnitId;
            if (role === 'SUPERVISOR') {
                const supervisorBuId = req.user.businessUnitIds?.[0];
                if (!supervisorBuId) {
                    return { success: false, message: 'Supervisor sin unidad de negocio asignada' };
                }
                businessUnitId = supervisorBuId;
            } else if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys } =
                await getStageInfo(businessUnitId);
            const byStatus   = await countsByStatus(filter, statusKeys);
            const openLeads  = sumKeys(byStatus, statusKeys.filter((k) => !closedKeys.includes(k)));
            const wonLeads   = sumKeys(byStatus, wonKeys);
            const lostLeads  = sumKeys(byStatus, lostKeys);
            const invalidLeads = sumKeys(byStatus, invalidKeys);

            return {
                success: true,
                message: 'Supervisor metrics retrieved',
                data: { byStatus, openLeads, wonLeads, lostLeads, invalidLeads },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving supervisor metrics' };
        }
    };

    getConversionMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const role      = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }

            // SUPERVISOR can only see metrics from their assigned business unit
            let businessUnitId = req.businessUnitId;
            if (role === 'SUPERVISOR') {
                const supervisorBuId = req.user.businessUnitIds?.[0];
                if (!supervisorBuId) {
                    return { success: false, message: 'Supervisor sin unidad de negocio asignada' };
                }
                businessUnitId = supervisorBuId;
            } else if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const { statusKeys, wonKeys, lostKeys, closedKeys } = await getStageInfo(businessUnitId);
            const byStatus = await countsByStatus(filter, statusKeys);
            const won    = sumKeys(byStatus, wonKeys);
            const lost   = sumKeys(byStatus, lostKeys);
            const open   = sumKeys(byStatus, statusKeys.filter((k) => !closedKeys.includes(k)));
            const total  = Object.values(byStatus).reduce((a, b) => a + b, 0);
            const closed = won + lost;
            const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;

            return {
                success: true,
                message: 'Conversion metrics retrieved',
                data: { won, lost, open, total, conversionRatePct: conversionRate, byStatus },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving conversion metrics' };
        }
    };

    getActivityMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const role      = req.user?.role;

            if (!companyId) return { success: false, message: 'Company context required' };

            const { period = 'today', userId } = req.query;
            let businessUnitId = req.businessUnitId || req.query.businessUnitId || null;

            // SUPERVISOR can only see activity from their assigned business unit
            if (role === 'SUPERVISOR') {
                const supervisorBuId = req.user.businessUnitIds?.[0];
                if (!supervisorBuId) {
                    return { success: false, message: 'Supervisor sin unidad de negocio asignada' };
                }
                businessUnitId = supervisorBuId;
            } else if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const now = new Date();
            let from;
            if (period === 'week') {
                from = new Date(now);
                const day = from.getDay();
                from.setDate(from.getDate() - day + (day === 0 ? -6 : 1));
                from.setHours(0, 0, 0, 0);
            } else if (period === 'month') {
                from = new Date(now);
                from.setDate(1);
                from.setHours(0, 0, 0, 0);
            } else {
                from = new Date(now);
                from.setHours(0, 0, 0, 0);
            }

            const filter = { companyId, eventAt: { $gte: from } };
            if (businessUnitId) filter.businessUnitId = businessUnitId;
            if (userId) filter.userId = userId;
            if (role === 'EXECUTIVE') filter.userId = String(req.user?.id || req.user?._id);

            let activityTypeDefs = [];
            if (businessUnitId) {
                const bu = await BusinessUnit.findById(businessUnitId).select('activityTypes').lean();
                if (bu?.activityTypes?.length > 0) {
                    activityTypeDefs = bu.activityTypes.map((a) => ({ key: a.key, label: a.label }));
                }
            }
            if (activityTypeDefs.length === 0) activityTypeDefs = DEFAULT_ACTIVITY_TYPES;

            const entries = await Promise.all(
                activityTypeDefs.map(({ key: t }) =>
                    LeadEvent.countDocuments({ ...filter, eventType: t }).then((n) => [t, n])
                )
            );
            const byType = Object.fromEntries(entries);

            const { wonKeys } = await getStageInfo(businessUnitId);
            const wonFilter   = { companyId, status: { $in: wonKeys }, updatedAt: { $gte: from } };
            if (businessUnitId) wonFilter.businessUnitId = businessUnitId;
            if (userId) wonFilter.ownerUserId = userId;
            if (role === 'EXECUTIVE') wonFilter.ownerUserId = String(req.user?.id || req.user?._id);
            const closures = await Lead.countDocuments(wonFilter);

            return {
                success: true,
                message: 'Activity metrics retrieved',
                data: { period, from, byType, closures, activityTypes: activityTypeDefs },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving activity metrics' };
        }
    };

    getSummaryMetrics = async (req) => {
        try {
            const companyId = req.companyId;
            const role      = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }

            // SUPERVISOR can only see metrics from their assigned business unit
            let businessUnitId = req.businessUnitId;
            if (role === 'SUPERVISOR') {
                const supervisorBuId = req.user.businessUnitIds?.[0];
                if (!supervisorBuId) {
                    return { success: false, message: 'Supervisor sin unidad de negocio asignada' };
                }
                businessUnitId = supervisorBuId;
            } else if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys } =
                await getStageInfo(businessUnitId);

            const [byStatus, eventCount] = await Promise.all([
                countsByStatus(filter, statusKeys),
                LeadEvent.countDocuments(filter),
            ]);

            const openLeads   = sumKeys(byStatus, statusKeys.filter((k) => !closedKeys.includes(k)));
            const wonLeads    = sumKeys(byStatus, wonKeys);
            const lostLeads   = sumKeys(byStatus, lostKeys);
            const invalidLeads = sumKeys(byStatus, invalidKeys);

            return {
                success: true,
                message: 'Summary metrics retrieved',
                data: { openLeads, wonLeads, lostLeads, invalidLeads, byStatus, totalEvents: eventCount },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving summary metrics' };
        }
    };

    getActivityCounters = async (req) => {
        try {
            const companyId = req.companyId;
            const role = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }

            // Determine business unit scope
            let businessUnitId = req.businessUnitId;
            let filter = { companyId };

            if (role === 'SUPERVISOR') {
                const supervisorBuId = req.user.businessUnitIds?.[0];
                if (!supervisorBuId) {
                    return { success: false, message: 'Supervisor sin unidad de negocio asignada' };
                }
                businessUnitId = supervisorBuId;
            }

            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            // Aggregate all activity counters from leads
            const counters = await Lead.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        callCount: { $sum: '$callCount' },
                        contactSuccessCount: { $sum: '$contactSuccessCount' },
                        followupCount: { $sum: '$followupCount' },
                        whatsappSentCount: { $sum: '$whatsappSentCount' },
                        emailSentCount: { $sum: '$emailSentCount' },
                        quoteSentCount: { $sum: '$quoteSentCount' },
                        rescheduleCount: { $sum: '$rescheduleCount' },
                        closureCount: { $sum: '$closureCount' },
                    },
                },
            ]);

            const data = counters.length > 0 ? counters[0] : {
                callCount: 0,
                contactSuccessCount: 0,
                followupCount: 0,
                whatsappSentCount: 0,
                emailSentCount: 0,
                quoteSentCount: 0,
                rescheduleCount: 0,
                closureCount: 0,
            };

            return {
                success: true,
                message: 'Activity counters retrieved',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving activity counters' };
        }
    };
}
