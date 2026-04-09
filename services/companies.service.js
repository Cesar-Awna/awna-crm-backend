import connectMongoDB from '../libs/mongoose.js';
import Company from '../models/Company.js';

export default class CompaniesService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const data = await Company.find().lean();
            return {
                success: true,
                message: 'Companies retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving companies',
            };
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findById(id).lean();
            if (!data) {
                return { success: false, message: 'Company not found' };
            }
            return {
                success: true,
                message: 'Company retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving company',
            };
        }
    };

    getCurrent = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) {
                return {
                    success: false,
                    message: 'Company context required',
                };
            }

            const data = await Company.findById(companyId).lean();
            if (!data) {
                return { success: false, message: 'Company not found' };
            }

            return {
                success: true,
                message: 'Company retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving company',
            };
        }
    };

    create = async (req) => {
        try {
            const data = await Company.create(req.body);
            return {
                success: true,
                message: 'Company created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating company',
            };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndUpdate(id, req.body, {
                new: true,
                lean: true,
            });
            if (!data) {
                return { success: false, message: 'Company not found' };
            }
            return {
                success: true,
                message: 'Company updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating company',
            };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndDelete(id).lean();
            if (!data) {
                return { success: false, message: 'Company not found' };
            }
            return {
                success: true,
                message: 'Company deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting company',
            };
        }
    };
}
