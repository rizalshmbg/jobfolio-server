import { Router } from 'express';

import { createApplicationController, getApplicationsController } from '../controllers/application.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { createApplicationSchema, getApplicationsQuerySchema } from '../validations/application.validations.js';

const router = Router();

router.post('/', authMiddleware, validate(createApplicationSchema), createApplicationController);
router.get('/', authMiddleware, validateQuery(getApplicationsQuerySchema), getApplicationsController);

export default router;
