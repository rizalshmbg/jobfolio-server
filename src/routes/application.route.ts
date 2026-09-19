import { Router } from 'express';

import {
  createApplicationController,
  deleteApplicationController,
  getApplicationByIdController,
  getApplicationsController,
  updateApplicationController,
} from '../controllers/application.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';
import {
  applicationIdParamsSchema,
  createApplicationSchema,
  getApplicationsQuerySchema,
  updateApplicationSchema,
} from '../validations/application.validation.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validate(createApplicationSchema),
  createApplicationController,
);

router.get(
  '/',
  authMiddleware,
  validateQuery(getApplicationsQuerySchema),
  getApplicationsController,
);

router.get(
  '/:id',
  authMiddleware,
  validateParams(applicationIdParamsSchema),
  getApplicationByIdController,
);

router.patch(
  '/:id',
  authMiddleware,
  validateParams(applicationIdParamsSchema),
  validate(updateApplicationSchema),
  updateApplicationController,
);

router.delete(
  '/:id',
  authMiddleware,
  validateParams(applicationIdParamsSchema),
  deleteApplicationController,
);

export default router;
