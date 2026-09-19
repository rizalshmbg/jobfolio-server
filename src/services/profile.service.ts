import prisma from '../config/prisma.js';
import { AppError } from '../errors/app-error.js';

import type { UpdateProfileInput } from '../validations/profile.validation.js';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Unauthorized');
  }

  return user;
}

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: data.name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};
