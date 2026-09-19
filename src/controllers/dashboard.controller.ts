import type { RequestHandler } from 'express';
import { getDashboard } from '../services/dashboard.service.js';

export const getDashboardController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;

  const result = await getDashboard(userId);

  res.status(200).json({
    success: true,
    message: 'Dashboard retrieved successfully',
    data: result,
  });
};
