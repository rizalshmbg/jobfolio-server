import type { RequestHandler } from 'express';

import {
  register,
  login,
  refreshAccessToken,
  logout,
} from '../services/auth.service.js';
import type {
  RegisterInput,
  LoginInput,
} from '../validations/auth.validation.js';
import { AppError } from '../errors/app-error.js';
import { clearRefreshTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookie.js';

export const registerController: RequestHandler = async (req, res) => {
  const user = await register(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
};

export const loginController: RequestHandler = async (req, res) => {
  const { refreshToken, ...data } = await login(req.body as LoginInput);

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data,
  });
};

export const refreshAccessTokenController: RequestHandler = async (
  req,
  res,
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, 'Unauthorized');
  }

  const result = await refreshAccessToken(refreshToken);

  res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
};

export const logoutController: RequestHandler = async (
  req,
  res,
) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logout(refreshToken);
  }

  res.clearCookie('refreshToken', clearRefreshTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};
