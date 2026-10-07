import { Router } from 'express';

import { matchApplicationController } from '../controllers/job-matching.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateParams } from '../middlewares/validate.middleware.js';
import { applicationIdParamsSchema } from '../validations/application.validation.js';

const router = Router();

router.post(
  '/applications/:id',
  authMiddleware,
  validateParams(applicationIdParamsSchema),
  matchApplicationController,
);

export default router;
