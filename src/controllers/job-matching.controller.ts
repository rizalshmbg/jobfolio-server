import type { RequestHandler } from 'express';

import type { ApplicationIdParams } from '../validations/application.validation.js';
import { matchApplication } from '../services/job-matching.service.js';

export const matchApplicationController: RequestHandler = async (req, res) => {
  const params = req.validatedParams as ApplicationIdParams;

  const userId = req.user!.userId;

  const result = await matchApplication(userId, params.id);

  return res.status(200).json({
    success: true,
    message: 'Application matched successfully',
    data: result,
  });
};
