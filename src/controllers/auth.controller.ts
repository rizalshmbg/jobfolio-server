import type { RequestHandler } from 'express';

import { register, login, getMe } from '../services/auth.service.js';
import type {
  RegisterInput,
  LoginInput,
} from '../validations/auth.validations.js';
import { env } from '../config/env.js';
import { REFRESH_TOKEN_TTL_MS } from '../utils/refresh-token.js';

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

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_MS,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data,
  });
};

export const getMeController: RequestHandler = async (req, res) => {
  const user = await getMe(req.user!.userId);

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
};
