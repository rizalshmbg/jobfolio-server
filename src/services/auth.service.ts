import bcrypt from 'bcrypt';

import prisma from '../config/prisma.js';
import type { RegisterInput } from '../validations/auth.validations.js';
import { AppError } from '../errors/app-error.js';

export const register = async (data: RegisterInput) => {
  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  // if user already exists
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  // hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
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
}