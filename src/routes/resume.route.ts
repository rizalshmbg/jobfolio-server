import { Router } from 'express';

import {
  getResumeController,
  uploadResumeController,
} from '../controllers/resume.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadResumeMiddleware } from '../middlewares/upload-resume.middleware.js';

const router = Router();

router.get('/', authMiddleware, getResumeController);

router.post(
  '/',
  authMiddleware,
  uploadResumeMiddleware.single('file'),
  uploadResumeController,
);

export default router;
