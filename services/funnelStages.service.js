import connectMongoDB from '../libs/mongoose.js';
import FunnelStage from '../models/FunnelStage.js';

export default class FunnelStagesService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            const role = req.user?.role;

            if (!companyId) {
                return { success: false, message: 'Company context required' };
            }
            // COMPANY_ADMIN can see all stages across all BUs
            if (!businessUnitId && role !== 'COMPANY_ADMIN' && role !== 'SUPER_ADMIN') {
                return { success: false, message: 'Business unit context required' };
            }

            const filter = { companyId };
            if (businessUnitId) {
                filter.businessUnitId = businessUnitId;
            }

            const data = await FunnelStage.find(filter).sort({ businessUnitId: 1, stageOrder: 1 }).lean();
            return {
                success: true,
                message: 'Funnel stages retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving funnel stages',
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
            const data = await FunnelStage.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'Funnel stage not found' };
            }
            return {
                success: true,
                message: 'Funnel stage retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving funnel stage',
            };
        }
    };

    getByBusinessUnit = async (req) => {
        try {
            const businessUnitId = req.params.businessUnitId || req.businessUnitId;
            const companyId = req.companyId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await FunnelStage.find({ companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'Funnel stages by business unit retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving funnel stages by business unit' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await FunnelStage.create({ ...req.body, companyId, businessUnitId });
            return {
                success: true,
                message: 'Funnel stage created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating funnel stage',
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
            const data = await FunnelStage.findOneAndUpdate(
                { _id: id, companyId, businessUnitId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) {
                return { success: false, message: 'Funnel stage not found' };
            }
            return {
                success: true,
                message: 'Funnel stage updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating funnel stage',
            };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await FunnelStage.findOneAndDelete({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'Funnel stage not found' };
            }
            return {
                success: true,
                message: 'Funnel stage deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting funnel stage',
            };
        }
    };
}
