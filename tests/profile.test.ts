import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { testUser, createTestUser } from './helpers/user.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';

beforeEach(cleanDatabase);
afterAll(disconnectDatabase);

describe('GET /api/profile', () => {
  it('should return authenticated user profile', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: user.id,
      name: testUser.name,
      email: testUser.email,
    });
    expect(response.body.data.password).toBeUndefined();
  });

  it('should return 401 when access token is missing', async () => {
    const response = await request(app).get('/api/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should return 401 when access token is invalid', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });
});

describe('PATCH /api/profile', () => {
  it('should update user profile successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated User',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Profile updated successfully');
    expect(response.body.data.name).toBe('Updated User');
    expect(response.body.data.password).toBeUndefined();
  });

  it('should persist updated profile to database', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated User',
      });

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(updatedUser?.name).toBe('Updated User');
  });

  it('should return 400 when name is invalid', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 when body is empty', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).patch('/api/profile').send({
      name: 'Updated User',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('PATCH /api/profile/password', () => {
  it('should update user password successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'new-password123',
        confirmPassword: 'new-password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Password changed successfully');

    const updatedPasswordUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(updatedPasswordUser).not.toBeNull();
    expect(updatedPasswordUser?.password).not.toBe(testUser.password);

    const isPasswordValid = await bcrypt.compare(
      'new-password123',
      updatedPasswordUser!.password,
    );

    expect(isPasswordValid).toBe(true);

    const isOldPasswordValid = await bcrypt.compare(
      testUser.password,
      updatedPasswordUser!.password,
    );

    expect(isOldPasswordValid).toBe(false);
  });

  it('should return 401 when current password is incorrect', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'wrong-password123',
        newPassword: 'new-password123',
        confirmPassword: 'new-password123',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Current password is incorrect');

    const unchangedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(unchangedUser).not.toBeNull();

    const isOldPasswordValid = await bcrypt.compare(
      testUser.password,
      unchangedUser!.password,
    );

    expect(isOldPasswordValid).toBe(true);
  });

  it('should return 400 when new password is the same with current password', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: testUser.password,
        confirmPassword: testUser.password,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      'New password must be different from current password',
    );

    const unchangedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(unchangedUser).not.toBeNull();

    const isOldPasswordValid = await bcrypt.compare(
      testUser.password,
      unchangedUser!.password,
    );

    expect(isOldPasswordValid).toBe(true);
  });

  it('should return 400 when confirm password does not match with new password', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'new-password123',
        confirmPassword: 'different-password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'confirmPassword',
        }),
      ]),
    );

    const unchangedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(unchangedUser).not.toBeNull();

    const isOldPasswordValid = await bcrypt.compare(
      testUser.password,
      unchangedUser!.password,
    );

    expect(isOldPasswordValid).toBe(true);
  });

  it('should return 400 when new password is less than 8 characters', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: '1234567',
        confirmPassword: '1234567',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'newPassword',
        }),
      ]),
    );
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).patch('/api/profile/password').send({
      currentPassword: testUser.password,
      newPassword: 'new-password123',
      confirmPassword: 'new-password123',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
