import { Router } from 'express';

import { importJobController } from '../controllers/job-import.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { jobImportSchema } from '../validations/job-import.validation.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validate(jobImportSchema),
  importJobController,
);

export default router;
