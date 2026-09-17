import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import { testApplication } from './helpers/application.js';
import { createTestUser } from './helpers/user.js';

beforeEach(cleanDatabase);
afterAll(disconnectDatabase);

describe('POST /api/applications', () => {
  it('should create application successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testApplication);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Application created successfully');
    expect(response.body.data).toMatchObject({
      company: testApplication.company,
      position: testApplication.position,
      status: testApplication.status,
      location: testApplication.location,
      employmentType: testApplication.employmentType,
      workArrangement: testApplication.workArrangement,
      salaryMin: testApplication.salaryMin,
      salaryMax: testApplication.salaryMax,
    });

    // check db and ownership of application
    const application = await prisma.application.findUnique({
      where: {
        id: response.body.data.id,
      },
    });

    expect(application).not.toBeNull();

    if (!application) {
      throw new Error('Application was not created');
    }

    expect(application.userId).toBe(user.id);
    expect(application.company).toBe(testApplication.company);
    expect(application.position).toBe(testApplication.position);
  });

  it('should use authenticated user as application owner', async () => {
    const authenticatedUser = await createTestUser();

    const otherUser = await prisma.user.create({
      data: {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      },
    });

    const accessToken = generateAccessToken({
      userId: authenticatedUser.id,
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        company: 'Company A',
        position: 'Frontend Developer',
        userId: otherUser.id,
      });

    expect(response.status).toBe(201);

    const application = await prisma.application.findUnique({
      where: {
        id: response.body.data.id,
      },
    });

    if (!application) {
      throw new Error('Application was not created');
    }

    expect(application.userId).toBe(authenticatedUser.id);
    expect(application.userId).not.toBe(otherUser.id);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).post('/api/applications').send(testApplication);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should return 400 when required fields are missing', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 when minimum salary is greater than maximum salary', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...testApplication,
        salaryMin: 15_000_000,
        salaryMax: 10_000_000,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
