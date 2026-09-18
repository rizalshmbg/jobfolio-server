import type { RequestHandler } from 'express';

import {
  createApplication,
  getApplicationById,
  getApplications,
} from '../services/application.service.js';
import {
  type ApplicationIdParams,
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

export const getApplicationByIdController: RequestHandler = async (req, res, next) => {
  try {
    // get validatedParams
    const params = req.validatedParams as ApplicationIdParams;

    // get userId
    const userId = req.user!.userId;

    // fetch getApplicationById()
    const result = await getApplicationById(userId, params.id);

    // return response
    res.status(200).json({
      success: true,
      message: 'Application retrieved successfully',
      data: result,
    })
  } catch (error) {
    next(error);
  }
};
