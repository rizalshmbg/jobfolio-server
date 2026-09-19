import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

type AccessTokenPayload = {
  userId: string;
};

export const generateAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  });

  if (typeof payload === 'string' || typeof payload.userId !== 'string') {
    throw new TypeError('Invalid access token payload');
  }

  return {
    userId: payload.userId,
  };
};
