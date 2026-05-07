import AdminService from '../services/admin.service.js';

const adminService = new AdminService();

export default class AdminController {
    getStats = async (req, res) => {
        try {
            const response = await adminService.getStats();
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };
}
