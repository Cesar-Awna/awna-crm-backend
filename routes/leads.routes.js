import express from 'express';
import LeadsController from '../controllers/leads.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const leadsController = new LeadsController();

// All lead routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

// CRUD base (no DELETE)
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
    '/company/:rut',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getByCompanyRut
);

router.get(
    '/company-name/:name',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getByCompanyName
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
    '/dormant',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getDormant
);

router.get(
    '/stagnant',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.getStagnant
);

router.get(
    '/stats',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.getStats
);

router.get(
    '/workload',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.getWorkloadByExecutive
);

router.get(
    '/unassigned',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR']),
    leadsController.getUnassigned
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
    leadsController.create
);

router.put(
    '/:id',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.update
);

// Acciones de negocio
router.post(
    '/:id/change-stage',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.changeStage
);

router.post(
    '/:id/register-contact',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.registerContact
);

router.post(
    '/:id/schedule-meeting',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.scheduleMeeting
);

router.post(
    '/:id/set-next-action',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.setNextAction
);

router.post(
    '/:id/assign',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.assignLead
);

router.post(
    '/:id/add-note',
    requireRole(['EXECUTIVE', 'SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.addNote
);

router.patch(
    '/:id/mark-won',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.markWon
);

router.patch(
    '/:id/mark-lost',
    requireRole(['SUPERVISOR', 'COMPANY_ADMIN']),
    leadsController.markLost
);

export default router;
