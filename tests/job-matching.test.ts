import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('../src/config/supabase.js', async () => {
  const { supabase } = await import('./mocks/supabase.js');
  return { supabase };
});

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import { createTestUser } from './helpers/user.js';
import { resetSupabaseMocks } from './helpers/supabase.js';
import { mockDownload } from './mocks/supabase.js';

const endpoint = (applicationId: string) =>
  `/api/jobs/matching/applications/${applicationId}`;

const matchResult = {
  final_score: 85,
  required_skills_score: 90,
  experience_score: 80,
  projects_score: 85,
  qualification_score: 75,
  preferred_skills_score: 80,
  preferred_skills_available: true,
  matched_required_skills: ['React', 'TypeScript'],
  missing_required_skills: [],
  matched_preferred_skills: ['Node.js'],
  experience_matches: [
    {
      matched: true,
      relevance: 'high',
      evidence: ['Two years of relevant experience'],
    },
  ],
  project_matches: [
    {
      matched: true,
      relevance: 'high',
      evidence: ['Built a React application'],
    },
  ],
  qualification_matches: [
    {
      matched: true,
      relevance: 'medium',
      evidence: ['Relevant educational background'],
    },
  ],
};

const createApplication = (userId: string) =>
  prisma.application.create({
    data: {
      userId,
      company: 'Example Company',
      position: 'Frontend Developer',
      status: 'APPLIED',
      description: 'Develop and maintain web applications.',
      requirements: ['React', 'TypeScript'],
      location: 'Jakarta',
      employmentType: 'FULL_TIME',
      workArrangement: 'HYBRID',
    },
  });

const createResume = (userId: string) =>
  prisma.resume.create({
    data: {
      userId,
      fileName: 'resume.pdf',
      filePath: `resumes/${userId}/resume.pdf`,
      mimeType: 'application/pdf',
      fileSize: 123,
    },
  });

const mockSuccessfulMatching = () => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      message: 'Analysis completed',
      data: matchResult,
    }),
  });
};

beforeEach(async () => {
  await cleanDatabase();
  resetSupabaseMocks();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('POST /api/jobs/matching/applications/:id', () => {
  it('returns matching results when the application and resume exist', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });
    const application = await createApplication(user.id);

    await createResume(user.id);
    mockSuccessfulMatching();

    const response = await request(app)
      .post(endpoint(application.id))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Application matched successfully',
      data: matchResult,
    });

    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('/analyze-and-match');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('job')).toBe(
      JSON.stringify({
        company: 'Example Company',
        position: 'Frontend Developer',
        description: 'Develop and maintain web applications.',
        requirements: ['React', 'TypeScript'],
        location: 'Jakarta',
        employmentType: 'FULL_TIME',
        workArrangement: 'HYBRID',
      }),
    );
  });

  it('returns 401 when the user is not authenticated', async () => {
    const response = await request(app).post(
      endpoint('00000000-0000-4000-8000-000000000001'),
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when the application ID is invalid', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });

    const response = await request(app)
      .post(endpoint('invalid-id'))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 404 when the application does not exist', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });

    // Resume exists so the missing-application error is deterministic.
    await createResume(user.id);

    const response = await request(app)
      .post(endpoint('00000000-0000-4000-8000-000000000001'))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Application not found');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no resume', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });
    const application = await createApplication(user.id);

    const response = await request(app)
      .post(endpoint(application.id))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Resume not found');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 404 when the application belongs to another user', async () => {
    const user = await createTestUser();
    const otherUser = await prisma.user.create({
      data: {
        name: 'Other Test User',
        email: 'other-test@example.com',
        password: user.password,
      },
    });

    const token = generateAccessToken({ userId: user.id });

    const application = await createApplication(otherUser.id);
    await createResume(user.id);

    const response = await request(app)
      .post(endpoint(application.id))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Application not found');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 502 when the matching service responds with a server error', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });
    const application = await createApplication(user.id);

    await createResume(user.id);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        detail: 'Matching service failed',
      }),
    });

    const response = await request(app)
      .post(endpoint(application.id))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Matching service failed');
  });

  it('returns 502 when the matching service cannot be reached', async () => {
    const user = await createTestUser();
    const token = generateAccessToken({ userId: user.id });
    const application = await createApplication(user.id);

    await createResume(user.id);

    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const response = await request(app)
      .post(endpoint(application.id))
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      'Unable to connect to job matching service',
    );
  });
});
