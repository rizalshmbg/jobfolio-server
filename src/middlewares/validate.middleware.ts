import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { CustomRequest } from '../types/express.js';
import type { ZodType } from 'zod';

export const validate = (schema: ZodType) => {
  return (req: CustomRequest, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;

    next();
  };
};

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req: CustomRequest, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.validatedQuery = result.data;

    next();
  };

export const validateParams =
  (schema: ZodType): RequestHandler =>
  (req: CustomRequest, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.validatedParams = result.data;

    next();
  };
