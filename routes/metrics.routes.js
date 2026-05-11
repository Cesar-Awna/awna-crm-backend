import express from 'express';
import MetricsController from '../controllers/metrics.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const metricsController = new MetricsController();

// All metrics routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/me',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getMyMetrics
);

router.get(
    '/executive',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getExecutiveMetrics
);

router.get(
    '/supervisor',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getSupervisorMetrics
);

router.get(
    '/conversion',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getConversionMetrics
);

router.get(
    '/summary',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getSummaryMetrics
);

router.get(
    '/activity',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getActivityMetrics
);

router.get(
    '/activity-counters',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    metricsController.getActivityCounters
);

export default router;
