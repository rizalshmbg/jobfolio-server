import { Router } from 'express';

import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
} from '../validations/auth.validation.js';
import {
  registerController,
  loginController,
  refreshAccessTokenController,
  logoutController,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);
router.post('/refresh-access-token', refreshAccessTokenController)
router.post('/logout', logoutController);

export default router;
