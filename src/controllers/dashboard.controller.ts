import type { Response } from 'express';
import type { CustomRequest } from '../types/express.js';
import { getDashboard } from '../services/dashboard.service.js';

export const getDashboardController = async (req: CustomRequest, res: Response) => {
  const userId = req.user!.userId;

  const result = await getDashboard(userId);

  res.status(200).json({
    success: true,
    message: 'Dashboard retrieved successfully',
    data: result,
  });
};
