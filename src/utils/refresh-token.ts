import crypto from 'node:crypto';

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashRefreshToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getRefreshTokenExpiry = () => {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
};
