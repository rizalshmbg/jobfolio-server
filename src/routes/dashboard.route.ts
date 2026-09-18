import { Router } from 'express';

import { getDashboardController } from '../controllers/dashboard.controller.js';

import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getDashboardController);

export default router;