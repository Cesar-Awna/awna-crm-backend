import express from 'express';
import UsersController from '../controllers/users.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const usersController = new UsersController();

// All user routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

router.get(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.getAll
);

router.get(
    '/executives',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR']),
    usersController.getExecutives
);

router.get(
    '/supervisors',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.getSupervisors
);

router.get(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.getById
);

router.post(
    '/',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.create
);

router.put(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.update
);

router.delete(
    '/:id',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.delete
);

router.patch(
    '/:id/assign-role',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.assignRole
);

router.patch(
    '/:id/assign-business-units',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']),
    usersController.assignBusinessUnits
);

router.patch(
    '/:id/assign-team',
    requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR']),
    usersController.assignTeam
);

export default router;
