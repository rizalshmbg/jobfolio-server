import { Router } from 'express';

import { updateProfileController } from '../controllers/profile.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validations/profile.validations.js';

const router = Router();

router.patch(
  '/',
  authMiddleware,
  validate(updateProfileSchema),
  updateProfileController,
);

export default router;
