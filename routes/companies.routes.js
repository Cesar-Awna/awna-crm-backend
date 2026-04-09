import express from 'express';
import CompaniesController from '../controllers/companies.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const companiesController = new CompaniesController();

// All company routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

// Company admin: get current company (based on token companyId)
router.get('/me', requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']), companiesController.getCurrent);

// SUPER_ADMIN routes
router.get('/', requireRole(['SUPER_ADMIN']), companiesController.getAll);
router.get('/:id', requireRole(['SUPER_ADMIN']), companiesController.getById);
router.post('/', requireRole(['SUPER_ADMIN']), companiesController.create);
router.put('/:id', requireRole(['SUPER_ADMIN']), companiesController.update);
router.delete('/:id', requireRole(['SUPER_ADMIN']), companiesController.delete);

export default router;
