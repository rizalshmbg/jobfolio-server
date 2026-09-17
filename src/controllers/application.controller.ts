import type { RequestHandler } from 'express';

import {
  createApplication,
  getApplications,
} from '../services/application.service.js';
import {
  type CreateApplicationInput,
  type GetApplicationsQuery,
} from '../validations/application.validations.js';

export const createApplicationController: RequestHandler = async (req, res) => {
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

export const getApplicationsController: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as GetApplicationsQuery;

  const result = await getApplications(req.user!.userId, query);

  res.status(200).json({
    success: true,
    message: 'Applications retrieved successfully',
    data: result.applications,
    meta: result.pagination,
  });
};
