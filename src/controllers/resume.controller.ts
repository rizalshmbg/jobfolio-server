import type { RequestHandler } from 'express';

import { getResume, uploadResume } from '../services/resume.service.js';

export const getResumeController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;

  const result = await getResume(userId);

  res.status(200).json({
    success: true,
    message: 'Resume retrieved successfully',
    data: result,
  });
};

export const uploadResumeController: RequestHandler = async (req, res) => {
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
