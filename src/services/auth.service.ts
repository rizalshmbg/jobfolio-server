import bcrypt from 'bcrypt';

import prisma from '../config/prisma.js';
import type { RegisterInput, LoginInput } from '../validations/auth.validations.js';
import { AppError } from '../errors/app-error.js';
import { generateAccessToken } from '../utils/jwt.js';

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

export const login = async (data: LoginInput) => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
    },
  });

  // if user does not exist
  if(!user) {
    throw new AppError(401, 'Email or password is incorrect');
  }

  // compare password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  // if password is not valid
  if(!isPasswordValid) {
    throw new AppError(401, 'Email or password is incorrect');
  }

  // generate access token
  const accessToken = generateAccessToken({
    userId: user.id,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
}

export const getMe = async (userId: string) => {
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
