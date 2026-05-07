import connectMongoDB from '../libs/mongoose.js';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination.js';
import LeadEvent from '../models/LeadEvent.js';

export default class LeadEventsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }

            const { leadId, eventType, dateFrom, dateTo, userId, page, limit, sort } = req.query || {};
            const filter = { companyId, businessUnitId };

            if (leadId) filter.leadId = leadId;
            if (eventType) filter.eventType = eventType;
            if (userId) filter.userId = userId;

            if (dateFrom || dateTo) {
                filter.eventAt = {};
                if (dateFrom) filter.eventAt.$gte = new Date(dateFrom);
                if (dateTo) filter.eventAt.$lte = new Date(dateTo);
            }

            const paginationParams = parsePaginationParams({ page, limit, sort });
            const result = await LeadEvent.paginate(filter, {
                page: paginationParams.page,
                limit: paginationParams.limit,
                sort: paginationParams.sort,
                lean: true,
            });

            return formatPaginatedResponse(result);
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead events' };
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
            const data = await LeadEvent.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!data) return { success: false, message: 'Lead event not found' };
            return { success: true, message: 'Lead event retrieved successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead event' };
        }
    };

    getByLeadId = async (req) => {
        try {
            const { leadId } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await LeadEvent.find({ leadId, companyId, businessUnitId })
                .sort({ eventAt: -1 })
                .lean();
            return {
                success: true,
                message: 'Lead events by lead retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead events by lead' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await LeadEvent.create({ ...req.body, companyId, businessUnitId });
            return { success: true, message: 'Lead event created successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error creating lead event' };
        }
    };
}
