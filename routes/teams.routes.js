import express from 'express';
import TeamsController from '../controllers/teams.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const teamsController = new TeamsController();

// All team routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

router.get(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR']),
    teamsController.getAll
);

router.get(
    '/:id/members',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    teamsController.getMembers
);

router.get(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR']),
    teamsController.getById
);

router.post(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    teamsController.create
);

router.put(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    teamsController.update
);

router.delete(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    teamsController.delete
);

export default router;
