import bcrypt from 'bcrypt';

import prisma from '../config/prisma.js';
import type { RegisterInput, LoginInput } from '../validations/auth.validations.js';
import { AppError } from '../errors/app-error.js';
import { generateAccessToken } from '../utils/jwt.js';
import { generateRefreshToken, getRefreshTokenExpiry, hashRefreshToken } from '../utils/refresh-token.js';

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

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    refreshToken,
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

export const refreshAccessToken = async (refreshToken: string) => {
  // hashing refresh token
  const tokenHash = hashRefreshToken(refreshToken);

  // check if session exists
  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
  });

  // if session does not exist
  if (!session) {
    throw new AppError(401, 'Unauthorized');
  }

  // check if session is expired
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    throw new AppError(401, 'Unauthorized');
  }

  // generate new access token
  const newAccessToken = generateAccessToken({
    userId: session.userId,
  });

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = getRefreshTokenExpiry();

  // update session
  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export const logout = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}
