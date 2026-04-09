import express from 'express';
import ProductsController from '../controllers/products.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/requireRole.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';
import requireBusinessUnitMiddleware from '../middlewares/requireBusinessUnit.middleware.js';

const router = express.Router();
const productsController = new ProductsController();

// All product routes require auth + company + business unit context
router.use(authMiddleware, requireCompanyMiddleware, requireBusinessUnitMiddleware);

router.get(
    '/',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    productsController.getAll
);

router.get(
    '/business-unit/:businessUnitId',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    productsController.getByBusinessUnit
);

router.get(
    '/:id',
    requireRole(['COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE']),
    productsController.getById
);

router.post(
    '/',
    requireRole(['COMPANY_ADMIN']),
    productsController.create
);

router.put(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    productsController.update
);

router.delete(
    '/:id',
    requireRole(['COMPANY_ADMIN']),
    productsController.delete
);

export default router;
