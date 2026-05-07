import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();
const authController = new AuthController();

// Public endpoints (no auth)
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);

// Protected endpoints
router.post('/logout', authMiddleware, requireCompanyMiddleware, authController.logout);
router.get('/me', authMiddleware, requireCompanyMiddleware, authController.me);
router.patch('/profile', authMiddleware, requireCompanyMiddleware, authController.updateProfile);
router.patch('/change-password', authMiddleware, requireCompanyMiddleware, validate(changePasswordSchema), authController.changePassword);

export default router;
