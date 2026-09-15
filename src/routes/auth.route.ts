import { Router } from 'express';

import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
} from '../validations/auth.validations.js';
import {
  registerController,
  loginController,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);

export default router;
