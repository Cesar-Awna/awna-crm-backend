import CompaniesService from '../services/companies.service.js';

const companiesService = new CompaniesService();

export default class CompaniesController {
    getCurrent = async (req, res) => {
        try {
            const response = await companiesService.getCurrent(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getAll = async (req, res) => {
        try {
            const response = await companiesService.getAll(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getById = async (req, res) => {
        try {
            const response = await companiesService.getById(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    create = async (req, res) => {
        try {
            const response = await companiesService.create(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    update = async (req, res) => {
        try {
            const response = await companiesService.update(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    delete = async (req, res) => {
        try {
            const response = await companiesService.delete(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
