import connectMongoDB from '../libs/mongoose.js';
import Product from '../models/Product.js';

export default class ProductsService {
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
            const data = await Product.find({ companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'Products retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving products',
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
            const data = await Product.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'Product not found' };
            }
            return {
                success: true,
                message: 'Product retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error retrieving product',
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
            const data = await Product.find({ companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'Products by business unit retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving products by business unit' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await Product.create({ ...req.body, companyId, businessUnitId });
            return {
                success: true,
                message: 'Product created successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error creating product',
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
            const data = await Product.findOneAndUpdate(
                { _id: id, companyId, businessUnitId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) {
                return { success: false, message: 'Product not found' };
            }
            return {
                success: true,
                message: 'Product updated successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error updating product',
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
            const data = await Product.findOneAndDelete({ _id: id, companyId, businessUnitId }).lean();
            if (!data) {
                return { success: false, message: 'Product not found' };
            }
            return {
                success: true,
                message: 'Product deleted successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return {
                success: false,
                message: 'Error deleting product',
            };
        }
    };
}
