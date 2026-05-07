import LeadsService from '../services/leads.service.js';

const leadsService = new LeadsService();

export default class LeadsController {
    getAll = async (req, res) => {
        try {
            const response = await leadsService.getAll(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getById = async (req, res) => {
        try {
            const response = await leadsService.getById(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    create = async (req, res) => {
        try {
            const response = await leadsService.create(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    update = async (req, res) => {
        try {
            const response = await leadsService.update(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    search = async (req, res) => {
        try {
            const response = await leadsService.search(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getAssignedList = async (req, res) => {
        try {
            const response = await leadsService.getAssignedList(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getMyDaySummary = async (req, res) => {
        try {
            const response = await leadsService.getMyDaySummary(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    changeStatus = async (req, res) => {
        try {
            const response = await leadsService.changeStatus(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    registerContact = async (req, res) => {
        try {
            const response = await leadsService.registerContact(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    assignLead = async (req, res) => {
        try {
            const response = await leadsService.assignLead(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    addNote = async (req, res) => {
        try {
            const response = await leadsService.addNote(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    logActivity = async (req, res) => {
        try {
            const response = await leadsService.logActivity(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getEvents = async (req, res) => {
        try {
            const response = await leadsService.getEvents(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getStats = async (req, res) => {
        try {
            const response = await leadsService.getStats(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getUnassigned = async (req, res) => {
        try {
            const response = await leadsService.getUnassigned(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    bulkImport = async (req, res) => {
        try {
            const response = await leadsService.bulkImport(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    bulkAssign = async (req, res) => {
        try {
            const response = await leadsService.bulkAssign(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };
}
