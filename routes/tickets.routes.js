import express from 'express';
import TicketsController from '../controllers/tickets.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';

const router = express.Router();
const ticketsController = new TicketsController();

// All ticket routes require auth + company context
router.use(authMiddleware, requireCompanyMiddleware);

// Any authenticated user can create tickets and see their own
router.post('/', ticketsController.create);
router.get('/mine', ticketsController.getMine);

// Support-side management
router.get(
    '/',
    requireRole(['SOPORTE', 'COMPANY_ADMIN']),
    ticketsController.getAll
);
router.patch(
    '/:id/status',
    requireRole(['SOPORTE', 'COMPANY_ADMIN']),
    ticketsController.updateStatus
);

export default router;
