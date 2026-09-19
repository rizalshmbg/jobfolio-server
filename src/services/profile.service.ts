import prisma from '../config/prisma.js';

import type { UpdateProfileInput } from '../validations/profile.validations.js';

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
