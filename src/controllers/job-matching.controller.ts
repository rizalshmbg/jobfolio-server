import type { Response } from 'express';
import type { CustomRequest } from '../types/express.js';

import type { ApplicationIdParams } from '../validations/application.validation.js';
import { matchApplication } from '../services/job-matching.service.js';

export const matchApplicationController = async (
  req: CustomRequest,
  res: Response,
) => {
  const params = req.validatedParams as ApplicationIdParams;

  const userId = req.user!.userId;

  const result = await matchApplication(userId, params.id);

  return res.status(200).json({
    success: true,
    message: 'Application matched successfully',
    data: result,
  });
};
