import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import {
  testApplication,
  createTestApplication,
} from './helpers/application.js';
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
    const response = await request(app)
      .post('/api/applications')
      .send(testApplication);

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

describe('GET /api/applications', () => {
  it('should get applications successfully', async () => {
    const user = await createTestUser();

    await createTestApplication(user.id);

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Applications retrieved successfully');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      company: testApplication.company,
      position: testApplication.position,
      status: testApplication.status,
    });
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should only return applications owned by authenticated user', async () => {
    const user = await createTestUser();

    const otherUser = await prisma.user.create({
      data: {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      },
    });

    await createTestApplication(user.id);

    await prisma.application.create({
      data: {
        userId: otherUser.id,
        company: 'Other Company',
        position: 'Backend Developer',
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].userId).toBe(user.id);
    expect(response.body.data[0].company).toBe(testApplication.company);
  });

  it('should return empty array when user has no applications', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).get('/api/applications');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should paginate applications', async () => {
    const user = await createTestUser();

    await Promise.all(
      Array.from({ length: 15 }, (_, index) =>
        prisma.application.create({
          data: {
            userId: user.id,
            company: `Company ${index + 1}`,
            position: 'Frontend Developer',
          },
        }),
      ),
    );

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications?page=2&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.meta).toEqual({
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it('should return 400 when pagination query is invalid', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications?page=0&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should search applications by company or position', async () => {
    const user = await createTestUser();

    await prisma.application.createMany({
      data: [
        {
          userId: user.id,
          company: 'Tokopedia',
          position: 'Frontend Developer',
        },
        {
          userId: user.id,
          company: 'Gojek',
          position: 'Backend Developer',
        },
        {
          userId: user.id,
          company: 'Traveloka',
          position: 'UI Designer',
        },
      ],
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications?search=developer')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it('should not return other user applications when searching', async () => {
    const user = await createTestUser();

    const otherUser = await prisma.user.create({
      data: {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      },
    });

    await prisma.application.create({
      data: {
        userId: otherUser.id,
        company: 'Secret Company',
        position: 'Frontend Developer',
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/applications?search=frontend')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });
});
