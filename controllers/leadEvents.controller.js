import LeadEventsService from '../services/leadEvents.service.js';

const leadEventsService = new LeadEventsService();

export default class LeadEventsController {
    getAll = async (req, res) => {
        try {
            const response = await leadEventsService.getAll(req);
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
            const response = await leadEventsService.getById(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getByLeadId = async (req, res) => {
        try {
            const response = await leadEventsService.getByLeadId(req);
            return res.status(response.success ? 200 : 400).json(response);
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
            const response = await leadEventsService.create(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
