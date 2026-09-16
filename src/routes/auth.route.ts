import { Router } from 'express';

import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
} from '../validations/auth.validations.js';
import {
  registerController,
  loginController,
  getMeController,
  refreshAccessTokenController,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);
router.get('/me', authMiddleware, getMeController);
router.post('/refresh-access-token', refreshAccessTokenController)

export default router;
