import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { AppError } from '../errors/app-error.js';

import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validations/profile.validation.js';

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
};

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

export const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      password: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Unauthorized');
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(401, 'Current password is incorrect');
  }

  if (data.currentPassword === data.newPassword) {
    throw new AppError(
      400,
      'New password must be different from current password',
    );
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
};
