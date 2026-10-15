import type { Response } from 'express';
import type { CustomRequest } from '../types/express.js';

import {
  getResume,
  uploadResume,
  deleteResume,
} from '../services/resume.service.js';

export const getResumeController = async (
  req: CustomRequest,
  res: Response,
) => {
  const userId = req.user!.userId;

  const result = await getResume(userId);

  res.status(200).json({
    success: true,
    message: 'Resume retrieved successfully',
    data: result,
  });
};

export const uploadResumeController = async (
  req: CustomRequest,
  res: Response,
) => {
  const userId = req.user!.userId;

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Resume file is required',
    });

    return;
  }

  const result = await uploadResume(userId, req.file);

  res.status(200).json({
    success: true,
    message: 'Resume uploaded successfully',
    data: result,
  });
};

export const deleteResumeController = async (
  req: CustomRequest,
  res: Response,
) => {
  const userId = req.user!.userId;

  await deleteResume(userId);

  res.status(200).json({
    success: true,
    message: 'Resume deleted successfully',
  });
};
