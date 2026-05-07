import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';

const router = express.Router();
const adminController = new AdminController();

router.use(authMiddleware, requireRole(['SUPER_ADMIN']));

router.get('/stats', adminController.getStats);

export default router;
