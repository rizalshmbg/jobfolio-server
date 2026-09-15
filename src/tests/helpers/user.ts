import bcrypt from 'bcrypt';
import prisma from '../../config/prisma.js';

export const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

export const createTestUser = async () => {
  const hashedPassword = await bcrypt.hash(
    testUser.password,
    10,
  );

  return prisma.user.create({
    data: {
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
    },
  });
};