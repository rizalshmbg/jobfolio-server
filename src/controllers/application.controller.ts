import type { RequestHandler } from 'express';

import { createApplication } from '../services/application.service.js';
import type { CreateApplicationInput } from '../validations/application.validations.js';

export const createApplicationController: RequestHandler = async (
  req,
  res,
) => {
  const application = await createApplication(
    req.user!.userId,
    req.body as CreateApplicationInput,
  );

  res.status(201).json({
    success: true,
    message: 'Application created successfully',
    data: application,
  });
};
