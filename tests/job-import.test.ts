import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockScrapeJob } = vi.hoisted(() => ({
  mockScrapeJob: vi.fn(),
}));

vi.mock('../src/services/job-scraper.service.js', () => ({
  scrapeJob: mockScrapeJob,
}));

import app from '../src/app.js';
import { AppError } from '../src/errors/app-error.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/user.js';

beforeEach(async () => {
  await cleanDatabase();

  mockScrapeJob.mockReset();
});

afterAll(disconnectDatabase);

describe('POST /api/jobs/import', () => {
  it('should import job information successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const scrapedJob = {
      company: 'PT Astra Graphia Information Technology',
      position: 'Frontend Engineer',
      description:
        'Develop and maintain the web application using React and Next.js',
      requirements: [
        'Bachelor degree in Computer Science',
        'Minimum 2 years of experience',
      ],
      jobUrl:
        'https://www.kalibrr.id/id-ID/c/wfveagezndntcyt/jobs/271840/frontend-engineer',
      location: 'Kota Jakarta Pusat, Indonesia',
      employmentType: 'FULL_TIME',
      workArrangement: null,
      salaryMin: null,
      salaryMax: null,
    };

    mockScrapeJob.mockResolvedValue(scrapedJob);

    const response = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        url: scrapedJob.jobUrl,
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Job information imported successfully',
      data: scrapedJob,
    });

    expect(mockScrapeJob).toHaveBeenCalledTimes(1);

    expect(mockScrapeJob).toHaveBeenCalledWith(scrapedJob.jobUrl);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).post('/api/jobs/import').send({
      url: 'https://www.kalibrr.id/id-ID/c/wfveagezndntcyt/jobs/271840/frontend-engineer',
    });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe('Unauthorized');

    expect(mockScrapeJob).not.toHaveBeenCalled();
  });

  it('should return 400 when URL is invalid', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        url: 'not-a-valid-url',
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe('Validation error');

    expect(mockScrapeJob).not.toHaveBeenCalled();
  });

  it('should return 400 when URL is missing', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe('Validation error');

    expect(mockScrapeJob).not.toHaveBeenCalled();
  });

  it('should return 422 when scraper cannot extract job information', async () => {
    const user = await createTestUser();
    const accessToken = generateAccessToken({ userId: user.id });

    mockScrapeJob.mockRejectedValue(
      new AppError(422, 'Unable to extract job information from this URL'),
    );

    const response = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        url: 'https://example.com/job',
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      message: 'Unable to extract job information from this URL',
    });

    expect(mockScrapeJob).toHaveBeenCalledWith('https://example.com/job');
  });

  it('should return 502 when scraper service is unavailable', async () => {
    const user = await createTestUser();
    const accessToken = generateAccessToken({ userId: user.id });

    mockScrapeJob.mockRejectedValue(
      new AppError(502, 'Unable to connect to job scraper service'),
    );

    const response = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        url: 'https://example.com/job',
      });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      success: false,
      message: 'Unable to connect to job scraper service',
    });
  });
});
