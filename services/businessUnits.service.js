import connectMongoDB from '../libs/mongoose.js';
import BusinessUnit from '../models/BusinessUnit.js';

export default class BusinessUnitsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await BusinessUnit.find({ companyId }).lean();
            return {
                success: true,
                message: 'Business units retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving business units',
            };
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body?.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await BusinessUnit.findOne({ _id: id, companyId }).lean();
            if (!data) {
                return { success: false, message: 'Business unit not found' };
            }
            return {
                success: true,
                message: 'Business unit retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving business unit',
            };
        }
    };

    create = async (req) => {
        try {
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.body.companyId || req.query.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await BusinessUnit.create({ ...req.body, companyId });
            return {
                success: true,
                message: 'Business unit created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating business unit',
            };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await BusinessUnit.findOneAndUpdate(
                { _id: id, companyId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) {
                return { success: false, message: 'Business unit not found' };
            }
            return {
                success: true,
                message: 'Business unit updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating business unit',
            };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            let companyId = req.companyId;
            if (req.user?.role === 'SUPER_ADMIN') {
                companyId = req.query.companyId || req.body?.companyId || null;
            }
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await BusinessUnit.findOneAndDelete({ _id: id, companyId }).lean();
            if (!data) {
                return { success: false, message: 'Business unit not found' };
            }
            return {
                success: true,
                message: 'Business unit deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting business unit',
            };
        }
    };
}
