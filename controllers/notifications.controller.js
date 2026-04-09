import NotificationsService from '../services/notifications.service.js';

const notificationsService = new NotificationsService();

export default class NotificationsController {
    getAll = async (req, res) => {
        try {
            const response = await notificationsService.getAll(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getUnread = async (req, res) => {
        try {
            const response = await notificationsService.getUnread(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    markAsRead = async (req, res) => {
        try {
            const response = await notificationsService.markAsRead(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    markAllAsRead = async (req, res) => {
        try {
            const response = await notificationsService.markAllAsRead(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
