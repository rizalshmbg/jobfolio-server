import { Router } from 'express';

import { createApplicationController, getApplicationsController } from '../controllers/application.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createApplicationSchema } from '../validations/application.validations.js';

const router = Router();

router.post('/', authMiddleware, validate(createApplicationSchema), createApplicationController);
router.get('/', authMiddleware, getApplicationsController);

export default router;
