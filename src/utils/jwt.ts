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
