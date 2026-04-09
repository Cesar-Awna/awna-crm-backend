import ImportsService from '../services/imports.service.js';

const importsService = new ImportsService();

export default class ImportsController {
    uploadLeadsCsv = async (req, res) => {
        try {
            const response = await importsService.uploadLeadsCsv(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getBatches = async (req, res) => {
        try {
            const response = await importsService.getBatches(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getBatchById = async (req, res) => {
        try {
            const response = await importsService.getBatchById(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getBatchErrors = async (req, res) => {
        try {
            const response = await importsService.getBatchErrors(req);
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
