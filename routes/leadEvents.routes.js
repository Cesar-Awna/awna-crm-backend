import express from 'express';
import LeadEventsController from '../controllers/leadEvents.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const leadEventsController = new LeadEventsController();

// All lead events routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadEventsController.getAll
);

router.get(
    '/lead/:leadId',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadEventsController.getByLeadId
);

router.get(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadEventsController.getById
);

router.post(
    '/',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadEventsController.create
);

export default router;
