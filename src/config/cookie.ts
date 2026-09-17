import type { CookieOptions } from 'express';

import { env } from './env.js';
import { REFRESH_TOKEN_TTL_MS } from '../utils/refresh-token.js';

export const refreshTokenCookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...refreshTokenCookieBaseOptions,
  maxAge: REFRESH_TOKEN_TTL_MS,
};

export const clearRefreshTokenCookieOptions: CookieOptions = {
  ...refreshTokenCookieBaseOptions,
};
