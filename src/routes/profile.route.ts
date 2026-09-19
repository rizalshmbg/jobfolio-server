import { Router } from 'express';

import {
  getProfileController,
  updateProfileController,
} from '../controllers/profile.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validations/profile.validation.js';

const router = Router();

router.get('/', authMiddleware, getProfileController);
router.patch(
  '/',
  authMiddleware,
  validate(updateProfileSchema),
  updateProfileController,
);

export default router;
