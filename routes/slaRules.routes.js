import express from 'express';
import SlaRulesController from '../controllers/slaRules.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const slaRulesController = new SlaRulesController();

// All SLA rules routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    slaRulesController.getAll
);

router.get(
    '/business-unit/:businessUnitId',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    slaRulesController.getByBusinessUnit
);

router.get(
    '/:id',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    slaRulesController.getById
);

router.post(
    '/',
    requireRole(['COMPANY_ADMIN']),
    slaRulesController.create
);

router.put(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    slaRulesController.update
);

router.delete(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    slaRulesController.delete
);

export default router;
