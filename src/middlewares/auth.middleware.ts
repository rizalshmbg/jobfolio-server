import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authMiddleware: RequestHandler = (req, _res, next) => {
  // Authorization: Bearer <accessToken>
  const authorization = req.headers.authorization;

  // If no token
  if (!authorization) {
    next(new AppError(401, 'Unauthorized'));
    return;
  }

  // Bearer <token>
  const [scheme, token] = authorization.split(' ');

  // if token is invalid
  if (scheme !== 'Bearer' || !token) {
    next(new AppError(401, 'Unauthorized'));
    return;
  }

  // if token is valid
  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
    }

    next();
  } catch {
    next(new AppError(401, 'Unauthorized'));
  }
}