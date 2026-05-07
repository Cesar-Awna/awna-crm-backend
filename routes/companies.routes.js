import express from 'express';
import CompaniesController from '../controllers/companies.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createCompanySchema } from '../validators/companies.validator.js';

const router = express.Router();
const companiesController = new CompaniesController();

// All company routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

// Company admin: get current company (based on token companyId)
router.get('/me', requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']), companiesController.getCurrent);

// SUPER_ADMIN routes
router.get('/', requireRole(['SUPER_ADMIN']), companiesController.getAll);
router.post('/create-with-admin', requireRole(['SUPER_ADMIN']), validate(createCompanySchema), companiesController.createWithAdmin);
router.get('/:id', requireRole(['SUPER_ADMIN']), companiesController.getById);
router.post('/', requireRole(['SUPER_ADMIN']), companiesController.create);
router.put('/:id', requireRole(['SUPER_ADMIN']), companiesController.update);
router.patch('/:id/suspend', requireRole(['SUPER_ADMIN']), companiesController.suspend);
router.patch('/:id/reactivate', requireRole(['SUPER_ADMIN']), companiesController.reactivate);
router.delete('/:id', requireRole(['SUPER_ADMIN']), companiesController.delete);

export default router;
