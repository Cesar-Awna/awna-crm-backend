import connectMongoDB from '../libs/mongoose.js';
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
            const { leadId } = req.query || {};
            const filter = { companyId, businessUnitId };
            if (leadId) filter.leadId = leadId;
            const data = await LeadEvent.find(filter).sort({ eventAt: -1 }).lean();
            return {
                success: true,
                message: 'Lead events retrieved successfully',
                data,
            };
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
