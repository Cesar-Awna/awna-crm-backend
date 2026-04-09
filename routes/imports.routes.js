import express from 'express';
import ImportsController from '../controllers/imports.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const importsController = new ImportsController();

// All imports routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.post(
    '/leads/csv',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    importsController.uploadLeadsCsv
);

router.get(
    '/batches',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    importsController.getBatches
);

router.get(
    '/batches/:id',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    importsController.getBatchById
);

router.get(
    '/batches/:id/errors',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    importsController.getBatchErrors
);

export default router;
