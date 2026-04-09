import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import LeadCompany from '../models/LeadCompany.js';
import FunnelStage from '../models/FunnelStage.js';

export default class LeadsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const role = req.user?.role;

            // COMPANY_ADMIN can query all BUs (businessUnitId = null)
            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const { status, ownerUserId, stageId } = req.query || {};
            const filter = { companyId };

            // Only filter by BU if provided
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }
            if (status) filter.status = status;
            if (ownerUserId) filter.ownerUserId = ownerUserId;
            if (stageId) filter.currentStageId = stageId;

            const isExecutive = role === 'EXECUTIVE';
            if (isExecutive) filter.ownerUserId = req.user?.id || req.user?._id;

            const data = await Lead.find(filter).lean();

            return {
                success: true,
                message: 'Leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving leads',
            };
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
            return {
                success: false,
                message: 'Error retrieving lead',
            };
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
            if (!payload.currentStageId) {
                let initialStage = await FunnelStage.findOne({ companyId, businessUnitId })
                    .sort({ stageOrder: 1 })
                    .lean();
                if (!initialStage) {
                    initialStage = await FunnelStage.create({
                        companyId,
                        businessUnitId,
                        stageOrder: 1,
                        name: 'Nuevo',
                        isFinal: false,
                    });
                }
                payload.currentStageId = initialStage?._id;
            }
            if (!payload.ownerUserId && req.user?.role === 'EXECUTIVE') {
                payload.ownerUserId = req.user?.id || req.user?._id;
            }
            // Para SUPERVISOR/COMPANY_ADMIN también definimos owner por defecto
            // para cumplir el schema requerido.
            if (!payload.ownerUserId) {
                payload.ownerUserId = req.user?.id || req.user?._id;
            }
            if (payload.status === 'WON' || payload.status === 'LOST') {
                if (!payload.closedAt) {
                    payload.closedAt = new Date();
                }
            }
            if (payload.status === 'LOST' && payload.observation && !payload.lostReason) {
                payload.lostReason = payload.observation;
            }
            const data = await Lead.create(payload);

            return {
                success: true,
                message: 'Lead created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating lead',
            };
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
            if (updateBody.status === 'WON' || updateBody.status === 'LOST') {
                if (!updateBody.closedAt) {
                    updateBody.closedAt = new Date();
                }
            }
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
            return {
                success: false,
                message: 'Error updating lead',
            };
        }
    };

    search = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const { status, source } = req.query || {};
            const filter = { companyId, businessUnitId };
            if (status) filter.status = status;
            if (source) filter.source = source;
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const data = await Lead.find(filter).lean();
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

    getByCompanyRut = async (req) => {
        try {
            const { rut } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const companies = await LeadCompany.find({ companyRut: rut, companyId }).lean();
            if (!companies.length) {
                return { success: true, message: 'No leads found for company RUT', data: [] };
            }
            const leadIds = companies.map((c) => c.leadId);
            const filter = { _id: { $in: leadIds }, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const data = await Lead.find(filter).lean();
            return {
                success: true,
                message: 'Leads by company RUT retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving leads by company RUT' };
        }
    };

    getByCompanyName = async (req) => {
        try {
            const { name } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const lcFilter = name ? { companyName: new RegExp(name, 'i'), companyId } : { companyId };
            const companies = await LeadCompany.find(lcFilter).lean();
            if (!companies.length) {
                return { success: true, message: 'No leads found for company name', data: [] };
            }
            const leadIds = companies.map((c) => c.leadId);
            const filter = { _id: { $in: leadIds }, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const data = await Lead.find(filter).lean();
            return {
                success: true,
                message: 'Leads by company name retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving leads by company name' };
        }
    };

    getDormant = async (req) => {
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

            const filter = { isDormant: true, status: 'OPEN', companyId };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }
            if (role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }

            const data = await Lead.find(filter).lean();
            return {
                success: true,
                message: 'Dormant leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving dormant leads' };
        }
    };

    getStagnant = async (req) => {
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

            const { stagnationLevel } = req.query || {};
            const filter = { status: 'OPEN', stagnationLevel: { $exists: true, $ne: null }, companyId };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }
            if (stagnationLevel) filter.stagnationLevel = stagnationLevel;
            if (role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }

            const data = await Lead.find(filter).lean();
            return {
                success: true,
                message: 'Stagnant leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving stagnant leads' };
        }
    };

    getAssignedList = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { companyId, businessUnitId, status: 'OPEN' };
            if (req.user?.role === 'EXECUTIVE') {
                filter.ownerUserId = req.user?.id || req.user?._id;
            }
            const data = await Lead.find(filter).lean();

            return {
                success: true,
                message: 'Assigned leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving assigned leads',
            };
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
            const baseFilter = { companyId, businessUnitId, status: 'OPEN' };
            if (req.user?.role === 'EXECUTIVE') {
                baseFilter.ownerUserId = userId;
            }

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const [
                dueToday,
                overdue,
                noNextAction,
                openLeads,
                wonThisMonth,
                lostThisMonth,
                leadsDueToday,
                leadsOverdue,
                meetingsToday,
            ] = await Promise.all([
                Lead.countDocuments({
                    ...baseFilter,
                    nextActionAt: { $gte: startOfDay, $lte: endOfDay },
                }),
                Lead.countDocuments({
                    ...baseFilter,
                    nextActionAt: { $lt: startOfDay },
                }),
                Lead.countDocuments({
                    ...baseFilter,
                    nextActionAt: { $exists: false },
                }),
                Lead.countDocuments({ ...baseFilter }),
                Lead.countDocuments({
                    companyId,
                    businessUnitId,
                    ownerUserId: userId,
                    status: 'WON',
                    closedAt: { $gte: startOfMonth },
                }),
                Lead.countDocuments({
                    companyId,
                    businessUnitId,
                    ownerUserId: userId,
                    status: 'LOST',
                    closedAt: { $gte: startOfMonth },
                }),
                Lead.find({
                    ...baseFilter,
                    nextActionAt: { $gte: startOfDay, $lte: endOfDay },
                })
                    .limit(10)
                    .lean(),
                Lead.find({
                    ...baseFilter,
                    nextActionAt: { $lt: startOfDay },
                })
                    .sort({ nextActionAt: 1 })
                    .limit(10)
                    .lean(),
                LeadEvent.find({
                    companyId,
                    businessUnitId,
                    userId: String(userId),
                    eventType: 'MEETING_SCHEDULED',
                    eventAt: { $gte: startOfDay, $lte: endOfDay },
                })
                    .sort({ eventAt: 1 })
                    .lean(),
            ]);

            return {
                success: true,
                message: 'My day summary calculated successfully',
                data: {
                    counts: {
                        dueToday,
                        overdue,
                        noNextAction,
                        openLeads,
                        wonThisMonth,
                        lostThisMonth,
                    },
                    leadsDueToday,
                    leadsOverdue,
                    meetingsToday,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error calculating my day summary',
            };
        }
    };

    changeStage = async (req) => {
        try {
            const { id } = req.params;
            const { stageId } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!stageId) {
                return {
                    success: false,
                    message: 'stageId is required',
                };
            }
            const now = new Date();
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOneAndUpdate(
                filter,
                {
                    currentStageId: stageId,
                    lastStageChangedAt: now,
                },
                { new: true, lean: true }
            );
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }
            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType: 'STAGE_CHANGED',
                eventAt: now,
                metadata: {
                    newStageId: stageId,
                },
            });

            return {
                success: true,
                message: 'Lead stage changed successfully',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error changing lead stage',
            };
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

            const eventType =
                outcome === 'SUCCESS' ? 'CONTACT_SUCCESS' : 'CONTACT_ATTEMPT';

            const now = new Date();

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType,
                eventAt: now,
                metadata: { notes, outcome },
            });

            await Lead.findOneAndUpdate({ _id: id, companyId, businessUnitId }, { lastActivityAt: now });

            return {
                success: true,
                message: 'Contact registered successfully',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error registering contact',
            };
        }
    };

    scheduleMeeting = async (req) => {
        try {
            const { id } = req.params;
            const { scheduledAt, location, notes } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!scheduledAt) {
                return {
                    success: false,
                    message: 'scheduledAt is required',
                };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOne(filter).lean();
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            const when = new Date(scheduledAt);

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType: 'MEETING_SCHEDULED',
                eventAt: when,
                metadata: { location, notes },
            });

            await Lead.findOneAndUpdate(
                { _id: id, companyId, businessUnitId },
                { nextActionAt: when, nextActionType: 'MEETING' }
            );

            return {
                success: true,
                message: 'Meeting scheduled successfully',
                data: {},
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error scheduling meeting',
            };
        }
    };

    setNextAction = async (req) => {
        try {
            const { id } = req.params;
            const { nextActionAt, nextActionType } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const update = {};
            if (nextActionAt) update.nextActionAt = new Date(nextActionAt);
            if (nextActionType) update.nextActionType = nextActionType;
            const lead = await Lead.findOneAndUpdate(filter, update, {
                new: true,
                lean: true,
            });
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            return {
                success: true,
                message: 'Next action updated successfully',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating next action',
            };
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
                return {
                    success: false,
                    message: 'ownerUserId is required',
                };
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
            return {
                success: false,
                message: 'Error assigning lead',
            };
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
                return {
                    success: false,
                    message: 'note is required',
                };
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
            return {
                success: false,
                message: 'Error adding note',
            };
        }
    };

    markWon = async (req) => {
        try {
            const { id } = req.params;
            const { closedAmount } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const now = new Date();
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOneAndUpdate(
                filter,
                {
                    status: 'WON',
                    closedAt: now,
                    closedAmount: closedAmount ?? undefined,
                },
                { new: true, lean: true }
            );
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType: 'WON',
                eventAt: now,
                metadata: { closedAmount },
            });

            return {
                success: true,
                message: 'Lead marked as won',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error marking lead as won',
            };
        }
    };

    markLost = async (req) => {
        try {
            const { id } = req.params;
            const { lostReason } = req.body || {};
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const now = new Date();
            const filter = { _id: id, companyId, businessUnitId };
            if (req.user?.role === 'EXECUTIVE') filter.ownerUserId = req.user?.id || req.user?._id;
            const lead = await Lead.findOneAndUpdate(
                filter,
                {
                    status: 'LOST',
                    closedAt: now,
                    lostReason: lostReason ?? undefined,
                },
                { new: true, lean: true }
            );
            if (!lead) {
                return { success: false, message: 'Lead not found' };
            }

            await LeadEvent.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                leadId: lead._id,
                userId: req.user?.id || req.body.userId || '',
                eventType: 'LOST',
                eventAt: now,
                metadata: { lostReason },
            });

            return {
                success: true,
                message: 'Lead marked as lost',
                data: lead,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error marking lead as lost',
            };
        }
    };

    getWorkloadByExecutive = async (req) => {
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
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const workload = await Lead.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$ownerUserId',
                        openLeads: {
                            $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] },
                        },
                        wonLeads: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$status', 'WON'] },
                                            { $gte: ['$closedAt', startOfMonth] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        lostLeads: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$status', 'LOST'] },
                                            { $gte: ['$closedAt', startOfMonth] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        totalLeads: { $sum: 1 },
                    },
                },
                { $sort: { openLeads: -1 } },
            ]);

            return {
                success: true,
                message: 'Workload by executive retrieved successfully',
                data: workload,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving workload by executive',
            };
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

            const filter = {
                companyId,
                status: 'OPEN',
                $or: [
                    { ownerUserId: { $exists: false } },
                    { ownerUserId: null },
                    { ownerUserId: '' },
                ],
            };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const data = await Lead.find(filter).lean();

            return {
                success: true,
                message: 'Unassigned leads retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving unassigned leads',
            };
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
            return {
                success: false,
                message: 'Error bulk assigning leads',
            };
        }
    };

    getStats = async (req) => {
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
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const [open, wonThisMonth, lostThisMonth, atRisk] = await Promise.all([
                Lead.countDocuments({ ...filter, status: 'OPEN' }),
                Lead.countDocuments({
                    ...filter,
                    status: 'WON',
                    closedAt: { $gte: startOfMonth },
                }),
                Lead.countDocuments({
                    ...filter,
                    status: 'LOST',
                    closedAt: { $gte: startOfMonth },
                }),
                Lead.countDocuments({
                    ...filter,
                    status: 'OPEN',
                    $or: [
                        { isDormant: true },
                        { stagnationLevel: { $exists: true, $ne: null } },
                    ],
                }),
            ]);

            return {
                success: true,
                message: 'Lead stats retrieved successfully',
                data: {
                    open,
                    wonThisMonth,
                    lostThisMonth,
                    atRisk,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving lead stats',
            };
        }
    };
}
