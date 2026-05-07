import connectMongoDB from '../libs/mongoose.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { parsePaginationParams, formatPaginatedResponse, formatPaginationError } from '../utils/pagination.js';

export default class CompaniesService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const { status, search } = req.query || {};
            const filter = {};
            if (status) filter.status = status;
            if (search) {
                const re = new RegExp(search.trim(), 'i');
                filter.$or = [{ name: re }, { rut: re }];
            }

            const { page, limit, sort } = parsePaginationParams(req);

            const result = await Company.paginate(filter, {
                page,
                limit,
                sort,
                lean: true,
            });

            const ids = result.docs.map((c) => c._id);
            const counts = await User.aggregate([
                { $match: { companyId: { $in: ids } } },
                { $group: { _id: '$companyId', count: { $sum: 1 } } },
            ]);
            const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

            const data = result.docs.map((c) => ({
                ...c,
                userCount: countMap.get(String(c._id)) || 0,
            }));

            return {
                success: true,
                message: 'Companies retrieved successfully',
                data,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.pages,
                    totalDocs: result.totalDocs,
                    limit: result.limit,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return formatPaginationError('Error retrieving companies');
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            const company = await Company.findById(id).lean();
            if (!company) return { success: false, message: 'Company not found' };

            const userCount = await User.countDocuments({ companyId: id });

            return {
                success: true,
                message: 'Company retrieved successfully',
                data: { ...company, userCount },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving company' };
        }
    };

    getCurrent = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };

            const data = await Company.findById(companyId).lean();
            if (!data) return { success: false, message: 'Company not found' };

            return { success: true, message: 'Company retrieved successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving company' };
        }
    };

    create = async (req) => {
        try {
            const data = await Company.create(req.body);
            return { success: true, message: 'Company created successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error creating company' };
        }
    };

    createWithAdmin = async (req) => {
        try {
            const { name, rut, plan, adminFullName, adminEmail, adminPassword } = req.body;

            if (!name?.trim() || !adminFullName?.trim() || !adminEmail?.trim() || !adminPassword) {
                return { success: false, message: 'Nombre de empresa, nombre del admin, email y contraseña son obligatorios.' };
            }

            const existing = await User.findOne({ email: adminEmail.trim().toLowerCase() }).lean();
            if (existing) {
                return { success: false, message: 'Ya existe un usuario registrado con ese email.' };
            }

            const company = await Company.create({
                name: name.trim(),
                rut: rut?.trim() || undefined,
                status: 'ACTIVE',
                plan: plan || {},
            });

            const adminUser = await User.create({
                companyId: company._id,
                fullName: adminFullName.trim(),
                email: adminEmail.trim().toLowerCase(),
                passwordHash: adminPassword,
                roleName: 'COMPANY_ADMIN',
                isActive: true,
            });

            return {
                success: true,
                message: 'Empresa y administrador creados correctamente.',
                data: { company, adminUser: { _id: adminUser._id, fullName: adminUser.fullName, email: adminUser.email } },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error al crear empresa con administrador.' };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndUpdate(id, req.body, { new: true, lean: true });
            if (!data) return { success: false, message: 'Company not found' };
            return { success: true, message: 'Company updated successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error updating company' };
        }
    };

    suspend = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndUpdate(id, { status: 'SUSPENDED' }, { new: true, lean: true });
            if (!data) return { success: false, message: 'Company not found' };
            return { success: true, message: 'Empresa suspendida correctamente.', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error al suspender empresa' };
        }
    };

    reactivate = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndUpdate(id, { status: 'ACTIVE' }, { new: true, lean: true });
            if (!data) return { success: false, message: 'Company not found' };
            return { success: true, message: 'Empresa reactivada correctamente.', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error al reactivar empresa' };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            const data = await Company.findByIdAndDelete(id).lean();
            if (!data) return { success: false, message: 'Company not found' };
            return { success: true, message: 'Company deleted successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error deleting company' };
        }
    };
}
