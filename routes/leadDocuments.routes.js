import express from 'express';
import LeadDocumentsController from '../controllers/leadDocuments.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const leadDocumentsController = new LeadDocumentsController();

// All lead documents routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/lead/:leadId',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.getByLeadId
);

router.get(
    '/:id/download',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.download
);

router.get(
    '/:id/signed-url',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.signedUrl
);

router.get(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.getById
);

router.post(
    '/upload',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.upload
);

router.delete(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadDocumentsController.delete
);

export default router;
