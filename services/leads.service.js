import connectMongoDB from '../libs/mongoose.js';
import Lead, { LEAD_STATUSES } from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import User from '../models/User.js';
import BusinessUnit from '../models/BusinessUnit.js';
import { getStageInfo } from '../utils/stageInfo.js';
import { parsePaginationParams, formatPaginatedResponse, formatPaginationError } from '../utils/pagination.js';

export default class LeadsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const role = req.user?.role;

            if (!companyId) {
                return formatPaginationError('Company context required');
            }
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return formatPaginationError('Business unit context required');
            }

            const { status, ownerUserId, nextContactDateFrom, nextContactDateTo } = req.query || {};
            const filter = { companyId };

            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }
            if (status) filter.status = status;
            if (ownerUserId) filter.ownerUserId = ownerUserId;
            if (nextContactDateFrom || nextContactDateTo) {
                filter.nextContactDate = {};
                if (nextContactDateFrom) filter.nextContactDate.$gte = new Date(nextContactDateFrom);
                if (nextContactDateTo) filter.nextContactDate.$lte = new Date(nextContactDateTo);
            }

            if (role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;

            const { page, limit, sort } = parsePaginationParams(req);

            const result = await Lead.paginate(filter, {
                page,
                limit,
                sort,
                lean: true,
            });

            return {
                ...formatPaginatedResponse(result),
                message: 'Leads retrieved successfully',
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return formatPaginationError('Error retrieving leads');
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const data = await Lead.findOne(filter).lean();
            if (!data) {
                return { success: false, message: 'Lead not found' };
            }
            return {
                success: true,
                message: 'Lead retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const payload = { ...req.body, companyId, businessUnitId };
            const role = req.user?.role;

            if (role === 'SUPERVISOR' || role === 'COMPANY_ADMIN') {
                if (!payload.ownerUserId) {
                    return { success: false, message: 'Debes asignar el lead a un ejecutivo.' };
                }
                const owner = await User.findById(payload.ownerUserId).lean();
                if (!owner || owner.roleName !== 'EXECUTIVE') {
                    return { success: false, message: 'El lead debe asignarse a un ejecutivo válido.' };
                }
            } else {
                payload.ownerUserId = req.user?.id || req.user?._id;
            }

            if (!payload.status) {
                payload.status = 'NUEVO';
            }

            const data = await Lead.create(payload);

            return {
                success: true,
                message: 'Lead created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: error?.message || 'Error creating lead' };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const updateBody = { ...req.body };
            delete updateBody.companyId;
            delete updateBody.businessUnitId;

            const data = await Lead.findOneAndUpdate(filter, updateBody, {
                new: true,
                lean: true,
            });
            if (!data) {
                return { success: false, message: 'Lead not found' };
            }

            return {
                success: true,
                message: 'Lead updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: error?.message || 'Error updating lead' };
        }
    };

    search = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const { status, q } = req.query || {};
            const filter = { companyId, businessUnitId };
            if (status) filter.status = status;
            if (q) {
                const rx = new RegExp(q, 'i');
                const bu = await BusinessUnit.findById(businessUnitId).select('leadSchema').lean();
                const schemaFields = (bu?.leadSchema || []).filter(
                    (f) => f.type !== 'number' && f.type !== 'date'
                );
                filter.$or = [
                    { razonSocial: rx },
                    { rutEmpresa: rx },
                    { contactName: rx },
                    { contactEmail: rx },
                    { contactPhone: rx },
                    ...schemaFields.map((f) => ({ [`fields.${f.key}`]: rx })),
                ];
            }
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const data = await Lead.find(filter).sort({ createdAt: -1 }).lean();
            return {
                success: true,
                message: 'Search completed successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error searching leads' };
        }
    };

    getAssignedList = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const { closedKeys } = await getStageInfo(businessUnitId);
            const filter = {
                companyId,
                businessUnitId,
                status: { $nin: closedKeys },
            };
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const data = await Lead.find(filter).sort({ createdAt: -1 }).lean();

            return {
                success: true,
                message: 'Assigned leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving assigned leads' };
        }
    };

    getMyDaySummary = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const userId = req.user?.id || req.user?._id;
            const baseFilter = { companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') {
                baseFilter.ownerUserId = userId;
            }

            const now = new Date();
            const startOfMonth = new Date(now);
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const [buData, stageInfo] = await Promise.all([
                BusinessUnit.findById(businessUnitId).select('activityTypes').lean(),
                getStageInfo(businessUnitId),
            ]);
            const ACTIVITY_TYPES = buData?.activityTypes?.length > 0
                ? buData.activityTypes.map((a) => a.key)
                : ['CALL', 'CONTACT_SUCCESS', 'FOLLOWUP', 'WHATSAPP_SENT', 'EMAIL_SENT', 'QUOTE_SENT', 'RESCHEDULE', 'NOTE_ADDED'];
            const { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys } = stageInfo;
            const eventFilter = {
                companyId,
                businessUnitId,
                userId: String(userId),
                eventAt: { $gte: startOfToday },
            };

            const [countsArr, wonThisMonth, lostThisMonth, todayEventEntries] = await Promise.all([
                Promise.all(
                    statusKeys.map((s) =>
                        Lead.countDocuments({ ...baseFilter, status: s }).then((n) => [s, n])
                    )
                ),
                Lead.countDocuments({ ...baseFilter, status: { $in: wonKeys },  updatedAt: { $gte: startOfMonth } }),
                Lead.countDocuments({ ...baseFilter, status: { $in: lostKeys }, updatedAt: { $gte: startOfMonth } }),
                Promise.all(
                    ACTIVITY_TYPES.map((t) =>
                        LeadEvent.countDocuments({ ...eventFilter, eventType: t }).then((n) => [t, n])
                    )
                ),
            ]);

            const byStatus = Object.fromEntries(countsArr);
            const todayByActivity = Object.fromEntries(todayEventEntries);
            const invalidCount = invalidKeys.reduce((acc, k) => acc + (byStatus[k] || 0), 0);
            const openCount    = statusKeys.filter((k) => !closedKeys.includes(k)).reduce((acc, k) => acc + (byStatus[k] || 0), 0);

            return {
                success: true,
                message: 'My day summary calculated successfully',
                data: {
                    counts: {
                        byStatus,
                        wonThisMonth,
                        lostThisMonth,
                        invalidCount,
                        openCount,
                    },
                    todayActivity: {
                        byType: todayByActivity,
                    },
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error calculating my day summary' };
        }
    };

    registerContact = async (req) => {
        try {
            const { id } = req.params;
            const { outcome, notes } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOne(filter).lean();
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            const eventType = outcome === 'SUCCESS' ? 'CONTACT_SUCCESS' : 'CONTACT_ATTEMPT';

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType,
                eventAt: new Date(),
                metadata: { notes, outcome },
            });

            return {
                success: true,
                message: 'Contact registered successfully',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error registering contact' };
        }
    };

    assignLead = async (req) => {
        try {
            const { id } = req.params;
            const { ownerUserId } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!ownerUserId) {
                return { success: false, message: 'ownerUserId is required' };
            }
            const assignedByUserId = req.user?.id || req.user?._id || req.body.assignedByUserId || '';
            const filter = { _id: id, companyId, businessUnitId };
            const lead = await Lead.findOneAndUpdate(
                filter,
                { ownerUserId, assignedByUserId },
                { new: true, lean: true }
            );
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            return {
                success: true,
                message: 'Lead assigned successfully',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error assigning lead' };
        }
    };

    addNote = async (req) => {
        try {
            const { id } = req.params;
            const { note } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!note) {
                return { success: false, message: 'note is required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOne(filter).lean();
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType: 'NOTE_ADDED',
                eventAt: new Date(),
                metadata: { note },
            });

            return {
                success: true,
                message: 'Note added successfully',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error adding note' };
        }
    };

    changeStatus = async (req) => {
        try {
            const { id } = req.params;
            const { status } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const buForStatus = await BusinessUnit.findById(businessUnitId).select('pipelineStages').lean();
        const validStatuses = buForStatus?.pipelineStages?.length > 0
            ? buForStatus.pipelineStages.map((s) => s.key)
            : LEAD_STATUSES;
        if (!status || !validStatuses.includes(status)) {
            return { success: false, message: 'Invalid status' };
        }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;

            const lead = await Lead.findOneAndUpdate(
                filter,
                { status },
                { new: true, lean: true }
            );
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            const matchedStage = buForStatus?.pipelineStages?.find((s) => s.key === status);
            const stageType    = matchedStage?.stageType || null;
            const eventType    = stageType === 'won' ? 'WON' : stageType === 'lost' ? 'LOST' : 'NOTE_ADDED';
            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || '',
                eventType,
                eventAt: new Date(),
                metadata: { status },
            });

            return {
                success: true,
                message: 'Lead status changed successfully',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error changing lead status' };
        }
    };

    getUnassigned = async (req) => {
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

            const { closedKeys: unassignedClosedKeys } = await getStageInfo(businessUnitId);
            const filter = {
                companyId,
                status: { $nin: unassignedClosedKeys },
                $or: [
                    { ownerUserId: { $exists: false } },
                    { ownerUserId: null },
                    { ownerUserId: '' },
                ],
            };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const data = await Lead.find(filter).sort({ createdAt: -1 }).lean();

            return {
                success: true,
                message: 'Unassigned leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving unassigned leads' };
        }
    };

    bulkAssign = async (req) => {
        try {
            const companyId = req.companyId;
            const { leadIds, ownerUserId } = req.body || {};

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
                return { success: false, message: 'leadIds array is required' };
            }
            if (!ownerUserId) {
                return { success: false, message: 'ownerUserId is required' };
            }

            const assignedByUserId = req.user?.id || req.user?._id || '';

            const result = await Lead.updateMany(
                { _id: { $in: leadIds }, companyId },
                { ownerUserId, assignedByUserId }
            );

            return {
                success: true,
                message: `${result.modifiedCount} leads assigned successfully`,
                data: { modifiedCount: result.modifiedCount },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error bulk assigning leads' };
        }
    };

    bulkImport = async (req) => {
        try {
            const { leads } = req.body;
            if (!Array.isArray(leads) || leads.length === 0) {
                return { success: false, message: 'No hay leads para importar.' };
            }
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }

            const docs = leads.map((lead) => ({
                companyId,
                businessUnitId,
                status: 'NUEVO',
                fields: lead.fields ?? {},
            }));

            const result = await Lead.insertMany(docs, { ordered: false });
            return {
                success: true,
                message: `${result.length} leads importados correctamente.`,
                data: { count: result.length },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: error?.message || 'Error al importar leads' };
        }
    };

    logActivity = async (req) => {
        try {
            const { id } = req.params;
            const { eventType, note, eventAt } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const bu = await BusinessUnit.findById(businessUnitId).select('activityTypes').lean();
            const allowedTypes = bu?.activityTypes?.length > 0
                ? bu.activityTypes.map((a) => a.key)
                : ['CALL', 'CONTACT_SUCCESS', 'FOLLOWUP', 'WHATSAPP_SENT', 'EMAIL_SENT', 'QUOTE_SENT', 'RESCHEDULE', 'NOTE_ADDED'];

            if (!eventType || !allowedTypes.includes(eventType)) {
                return { success: false, message: 'Invalid event type' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOne(filter).lean();
            if (!lead) return { success: false, message: 'Lead not found' };

            // Legacy counter map kept for backward compat — also increment activityCounts map
            const COUNTER_MAP = {
                CALL:            'callCount',
                CONTACT_SUCCESS: 'contactSuccessCount',
                FOLLOWUP:        'followupCount',
                WHATSAPP_SENT:   'whatsappSentCount',
                EMAIL_SENT:      'emailSentCount',
                QUOTE_SENT:      'quoteSentCount',
                RESCHEDULE:      'rescheduleCount',
            };
            const incObj = { [`activityCounts.${eventType}`]: 1 };
            const legacyField = COUNTER_MAP[eventType];
            if (legacyField) incObj[legacyField] = 1;

            await Promise.all([
                LeadEvent.create({
                    companyId: lead.companyId,
                    businessUnitId: lead.businessUnitId,
                    leadId: lead._id,
                    userId: req.user?.id || req.body.userId || '',
                    eventType,
                    eventAt: eventAt ? new Date(eventAt) : new Date(),
                    metadata: { note },
                }),
                Lead.updateOne({ _id: lead._id }, { $inc: incObj }),
            ]);

            return { success: true, message: 'Activity logged successfully', data: {} };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error logging activity' };
        }
    };

    getEvents = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOne(filter, '_id').lean();
            if (!lead) return { success: false, message: 'Lead not found' };

            const data = await LeadEvent.find({ leadId: id, companyId })
                .sort({ eventAt: -1 })
                .limit(50)
                .lean();

            return { success: true, message: 'Events retrieved successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving events' };
        }
    };

    getStats = async (req) => {
        try {
            const companyId = req.companyId;
            const role      = req.user?.role;
            // COMPANY_ADMIN can override via ?businessUnitId= query param
            const businessUnitId = req.businessUnitId || req.query.businessUnitId || null;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { companyId };
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys } =
                await getStageInfo(businessUnitId);

            const entries = await Promise.all(
                statusKeys.map((s) =>
                    Lead.countDocuments({ ...filter, status: s }).then((n) => [s, n])
                )
            );
            const byStatus    = Object.fromEntries(entries);
            const total       = entries.reduce((acc, [, n]) => acc + n, 0);
            const wonCount    = wonKeys.reduce((acc, k) => acc + (byStatus[k] || 0), 0);
            const lostCount   = lostKeys.reduce((acc, k) => acc + (byStatus[k] || 0), 0);
            const invalidCount = invalidKeys.reduce((acc, k) => acc + (byStatus[k] || 0), 0);
            const openCount   = statusKeys.filter((k) => !closedKeys.includes(k))
                .reduce((acc, k) => acc + (byStatus[k] || 0), 0);

            return {
                success: true,
                message: 'Lead stats retrieved successfully',
                data: { total, byStatus, wonCount, lostCount, invalidCount, openCount },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead stats' };
        }
    };
}
