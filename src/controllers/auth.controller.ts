import type { RequestHandler } from 'express';

import { register } from '../services/auth.service.js';
import type { RegisterInput } from '../validations/auth.validations.js';

export const registerController: RequestHandler = async (req, res) => {
  const user = await register(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
};
