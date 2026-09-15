import type { RequestHandler } from 'express';

import { register, login } from '../services/auth.service.js';
import type { RegisterInput, LoginInput } from '../validations/auth.validations.js';

export const registerController: RequestHandler = async (req, res) => {
  const user = await register(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
};

export const loginController: RequestHandler = async (req, res) => {
  const result = await login(req.body as LoginInput);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
};
