import connectMongoDB from '../libs/mongoose.js';
import Notification from '../models/Notification.js';

export default class NotificationsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const userId = req.user?.id || req.user?._id;
            if (!userId) return { success: false, message: 'User context required' };
            const data = await Notification.find({ companyId, userId }).sort({ createdAt: -1 }).lean();
            return {
                success: true,
                message: 'Notifications retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving notifications' };
        }
    };

    getUnread = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const userId = req.user?.id || req.user?._id;
            if (!userId) return { success: false, message: 'User context required' };
            const data = await Notification.find({ companyId, userId, readAt: null })
                .sort({ createdAt: -1 })
                .lean();
            return {
                success: true,
                message: 'Unread notifications retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving unread notifications' };
        }
    };

    markAsRead = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const userId = req.user?.id || req.user?._id;
            if (!companyId || !userId) return { success: false, message: 'Context required' };
            const doc = await Notification.findOneAndUpdate(
                { _id: id, companyId, userId },
                { readAt: new Date() },
                { new: true, lean: true }
            );
            if (!doc) return { success: false, message: 'Notification not found' };
            return { success: true, message: 'Notification marked as read', data: doc };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error marking notification as read' };
        }
    };

    markAllAsRead = async (req) => {
        try {
            const companyId = req.companyId;
            const userId = req.user?.id || req.user?._id;
            if (!companyId || !userId) return { success: false, message: 'Context required' };
            const result = await Notification.updateMany(
                { companyId, userId, readAt: null },
                { readAt: new Date() }
            );
            return {
                success: true,
                message: 'All notifications marked as read',
                data: { modifiedCount: result.modifiedCount },
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error marking all as read' };
        }
    };
}
