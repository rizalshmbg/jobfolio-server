import type { RequestHandler } from 'express';

import {
  changePassword,
  getProfile,
  updateProfile,
} from '../services/profile.service.js';
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validations/profile.validation.js';

export const getProfileController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;

  const result = await getProfile(userId);

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
};

export const updateProfileController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const data = req.body as UpdateProfileInput;

  const result = await updateProfile(userId, data);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
};

export const changePasswordController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const data = req.body as ChangePasswordInput;

  await changePassword(userId, data);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
};
