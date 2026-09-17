import { Router } from 'express';

import { createApplicationController } from '../controllers/application.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createApplicationSchema } from '../validations/application.validations.js';

const router = Router();

router.post('/', authMiddleware, validate(createApplicationSchema), createApplicationController);

export default router;
