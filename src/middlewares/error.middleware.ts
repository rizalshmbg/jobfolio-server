import type { ErrorRequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';
import logger from '../config/logger.js';

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  logger.error(error, 'Unhandled error');

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
