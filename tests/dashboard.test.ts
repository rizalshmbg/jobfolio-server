import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/user.js';

beforeEach(cleanDatabase);
afterAll(disconnectDatabase);

describe('GET /api/dashboard', () => {
  it('should return dashboard summary correctly', async () => {
    const user = await createTestUser();

    await prisma.application.createMany({
      data: [
        {
          userId: user.id,
          company: 'Company A',
          position: 'Frontend Developer',
          status: 'APPLIED',
        },
        {
          userId: user.id,
          company: 'Company B',
          position: 'Backend Developer',
          status: 'APPLIED',
        },
        {
          userId: user.id,
          company: 'Company C',
          position: 'Fullstack Developer',
          status: 'INTERVIEW',
        },
        {
          userId: user.id,
          company: 'Company D',
          position: 'Software Engineer',
          status: 'OFFER',
        },
      ],
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary).toEqual({
      total: 4,
      wishlist: 0,
      applied: 2,
      screening: 0,
      interview: 1,
      technicalTest: 0,
      offer: 1,
      rejected: 0,
      withdrawn: 0,
    });
  });

  it('should only count applications owned by authenticated user', async () => {
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
        userId: user.id,
        company: 'Tokopedia',
        position: 'Frontend Developer',
        status: 'APPLIED',
      },
    });

    await prisma.application.create({
      data: {
        userId: otherUser.id,
        company: 'Gojek',
        position: 'Backend Developer',
        status: 'INTERVIEW',
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary.total).toBe(1);
    expect(response.body.data.summary.applied).toBe(1);
    expect(response.body.data.summary.interview).toBe(0);
    expect(response.body.data.recentApplications).toHaveLength(1);
    expect(response.body.data.recentApplications[0].company).toBe('Tokopedia');
  });

  it('should return empty dashboard when user has no applications', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body.data.summary).toEqual({
      total: 0,
      wishlist: 0,
      applied: 0,
      screening: 0,
      interview: 0,
      technicalTest: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    });

    expect(response.body.data.recentApplications).toEqual([]);
  });

  it('should return maximum 5 recent applications', async () => {
    const user = await createTestUser();

    await prisma.application.createMany({
      data: Array.from({ length: 7 }, (_, index) => ({
        userId: user.id,
        company: `Company ${index + 1}`,
        position: 'Software Engineer',
        status: 'APPLIED',
      })),
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body.data.summary.total).toBe(7);

    expect(response.body.data.recentApplications).toHaveLength(5);
  });

  it('should order recent applications by updatedAt descending', async () => {
    const user = await createTestUser();

    await prisma.application.create({
      data: {
        userId: user.id,
        company: 'Old Company',
        position: 'Frontend Developer',
        status: 'APPLIED',
        updatedAt: new Date('2026-09-15T10:00:00Z'),
      },
    });

    await prisma.application.create({
      data: {
        userId: user.id,
        company: 'Newest Company',
        position: 'Backend Developer',
        status: 'INTERVIEW',
        updatedAt: new Date('2026-09-18T10:00:00Z'),
      },
    });

    await prisma.application.create({
      data: {
        userId: user.id,
        company: 'Middle Company',
        position: 'Fullstack Developer',
        status: 'SCREENING',
        updatedAt: new Date('2026-09-17T10:00:00Z'),
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(
      response.body.data.recentApplications.map(
        (application: { company: string }) => application.company,
      ),
    ).toEqual(['Newest Company', 'Middle Company', 'Old Company']);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
