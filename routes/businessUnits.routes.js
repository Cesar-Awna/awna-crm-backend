import express from 'express';
import BusinessUnitsController from '../controllers/businessUnits.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const businessUnitsController = new BusinessUnitsController();

// All business unit routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

router.get(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    businessUnitsController.getAll
);

router.get(
    '/:id/schema',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    businessUnitsController.getSchema
);

router.put(
    '/:id/schema',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    businessUnitsController.updateSchema
);

router.get(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    businessUnitsController.getById
);

router.post(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    businessUnitsController.create
);

router.put(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    businessUnitsController.update
);

router.delete(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    businessUnitsController.delete
);

export default router;
