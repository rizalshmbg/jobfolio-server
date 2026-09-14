import type { RequestHandler } from 'express';

import { AppError } from '@errors/app-error.js';

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}