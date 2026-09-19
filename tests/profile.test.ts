import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/user.js';

beforeEach(cleanDatabase);
afterAll(disconnectDatabase);

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
