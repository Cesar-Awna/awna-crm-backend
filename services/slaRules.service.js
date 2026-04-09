import connectMongoDB from '../libs/mongoose.js';
import SlaStageRule from '../models/SlaStageRule.js';

export default class SlaRulesService {
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
            const data = await SlaStageRule.find({ companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'SLA rules retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving SLA rules',
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
            const data = await SlaStageRule.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'SLA rule not found' };
            }
            return {
                success: true,
                message: 'SLA rule retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving SLA rule',
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
            const data = await SlaStageRule.find({ companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'SLA rules by business unit retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving SLA rules by business unit' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await SlaStageRule.create({ ...req.body, companyId, businessUnitId });
            return {
                success: true,
                message: 'SLA rule created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating SLA rule',
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
            const data = await SlaStageRule.findOneAndUpdate(
                { _id: id, companyId, businessUnitId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) {
                return { success: false, message: 'SLA rule not found' };
            }
            return {
                success: true,
                message: 'SLA rule updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating SLA rule',
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
            const data = await SlaStageRule.findOneAndDelete({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'SLA rule not found' };
            }
            return {
                success: true,
                message: 'SLA rule deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting SLA rule',
            };
        }
    };
}
