import express from 'express';
import ExampleController from '../controllers/example.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireCompanyMiddleware from '../middlewares/requireCompany.middleware.js';

const router = express.Router();
const exampleController = new ExampleController();

// Example endpoint: require auth + company context
router.get('/status', authMiddleware, requireCompanyMiddleware, exampleController.getStatus);

export default router;
