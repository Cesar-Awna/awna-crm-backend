import express from 'express';
import LeadsController from '../controllers/leads.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createLeadSchema,
  changeStatusSchema,
  assignLeadSchema,
  registerContactSchema,
  addNoteSchema,
  logActivitySchema,
} from '../validators/leads.validator.js';

const router = express.Router();
const leadsController = new LeadsController();

router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getAll
);

router.get(
    '/search',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.search
);

router.get(
    '/assigned/list',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getAssignedList
);

router.get(
    '/my-day/summary',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getMyDaySummary
);

router.get(
    '/stats',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.getStats
);

router.get(
    '/unassigned',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.getUnassigned
);

router.post(
    '/bulk-import',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.bulkImport
);

router.post(
    '/bulk-assign',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.bulkAssign
);

router.get(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getById
);

router.post(
    '/',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    validate(createLeadSchema),
    leadsController.create
);

router.put(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.update
);

router.post(
    '/:id/change-status',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    validate(changeStatusSchema),
    leadsController.changeStatus
);

router.post(
    '/:id/register-contact',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    validate(registerContactSchema),
    leadsController.registerContact
);

router.post(
    '/:id/assign',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    validate(assignLeadSchema),
    leadsController.assignLead
);

router.post(
    '/:id/add-note',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    validate(addNoteSchema),
    leadsController.addNote
);

router.post(
    '/:id/log-activity',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    validate(logActivitySchema),
    leadsController.logActivity
);

router.get(
    '/:id/events',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getEvents
);

export default router;
