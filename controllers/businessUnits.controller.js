import BusinessUnitsService from '../services/businessUnits.service.js';

const businessUnitsService = new BusinessUnitsService();

export default class BusinessUnitsController {
    getAll = async (req, res) => {
        try {
            const response = await businessUnitsService.getAll(req);
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
            const response = await businessUnitsService.getById(req);
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
            const response = await businessUnitsService.create(req);
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
            const response = await businessUnitsService.update(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getSchema = async (req, res) => {
        try {
            const response = await businessUnitsService.getSchema(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    updateSchema = async (req, res) => {
        try {
            const response = await businessUnitsService.updateSchema(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    delete = async (req, res) => {
        try {
            const response = await businessUnitsService.delete(req);
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
