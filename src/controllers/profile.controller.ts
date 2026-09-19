import type { RequestHandler } from 'express';

import { getProfile, updateProfile } from '../services/profile.service.js';
import type { UpdateProfileInput } from '../validations/profile.validations.js';

export const getProfileController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const result = await getProfile(userId);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user!.userId;
    const data = req.body as UpdateProfileInput;

    const result = await updateProfile(userId, data);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
