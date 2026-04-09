import express from 'express';
import FunnelStagesController from '../controllers/funnelStages.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const funnelStagesController = new FunnelStagesController();

// All funnel stage routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    funnelStagesController.getAll
);

router.get(
    '/business-unit/:businessUnitId',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    funnelStagesController.getByBusinessUnit
);

router.get(
    '/:id',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    funnelStagesController.getById
);

router.post(
    '/',
    requireRole(['COMPANY_ADMIN']),
    funnelStagesController.create
);

router.put(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    funnelStagesController.update
);

router.delete(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    funnelStagesController.delete
);

export default router;
