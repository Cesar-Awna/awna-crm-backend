import express from 'express';
import NotificationsController from '../controllers/notifications.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const notificationsController = new NotificationsController();

// All notification routes require auth + company context (any authenticated role)
router.use(authMiddleware, requireCompanyMiddleware);

router.get('/', notificationsController.getAll);
router.get('/unread', notificationsController.getUnread);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);

export default router;
