import type { RequestHandler } from 'express';

import { updateProfile } from '../services/profile.service.js';
import type { UpdateProfileInput } from '../validations/profile.validations.js';

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
