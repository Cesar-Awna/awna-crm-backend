import express from 'express';
import RankingController from '../controllers/ranking.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const rankingController = new RankingController();

// All ranking routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/weekly',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    rankingController.getWeekly
);

router.get(
    '/monthly',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    rankingController.getMonthly
);

router.get(
    '/me',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    rankingController.getMe
);

router.get(
    '/user/:userId',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    rankingController.getByUser
);

export default router;
