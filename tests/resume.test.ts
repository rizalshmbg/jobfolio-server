import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from './mocks/supabase.js';

vi.mock('../src/config/supabase.js', () => ({
  supabase,
}));

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import {
  mockCreateSignedUrl,
  mockRemove,
  mockUpload,
} from './mocks/supabase.js';
import { createTestUser } from './helpers/user.js';
import { resetSupabaseMocks } from './helpers/supabase.js';

beforeEach(async () => {
  await cleanDatabase();
  resetSupabaseMocks();
});

afterAll(disconnectDatabase);

describe('GET /api/profile/resume', () => {
  it('should return resume metadata and signed URL when user has a resume', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: 'my-resume.pdf',
        filePath: `resumes/${user.id}/resume-id.pdf`,
        mimeType: 'application/pdf',
        fileSize: 12345,
      },
    });

    const response = await request(app)
      .get('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toMatchObject({
      fileName: 'my-resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 12345,
      url: 'https://example.com/signed-resume-url',
    });

    expect(response.body.data.filePath).toBeUndefined();

    expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when user does not have a resume', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .get('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Resume not found');
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).get('/api/profile/resume');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });
});

describe('POST /api/profile/resume', () => {
  it('should upload a PDF resume successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const fileBuffer = Buffer.from('fake pdf content');

    const response = await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', fileBuffer, {
        filename: 'my-resume.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Resume uploaded successfully');

    expect(response.body.data).toMatchObject({
      fileName: 'my-resume.pdf',
      mimeType: 'application/pdf',
      fileSize: fileBuffer.length,
    });

    expect(response.body.data.filePath).toBeUndefined();

    expect(mockUpload).toHaveBeenCalledTimes(1);

    const resume = await prisma.resume.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(resume).not.toBeNull();
    expect(resume?.fileName).toBe('my-resume.pdf');
    expect(resume?.mimeType).toBe('application/pdf');
    expect(resume?.fileSize).toBe(fileBuffer.length);
    expect(resume?.userId).toBe(user.id);
  });

  it('should replace the existing resume', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const firstFile = Buffer.from('first resume');

    await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', firstFile, {
        filename: 'resume-old.pdf',
        contentType: 'application/pdf',
      });

    const firstResume = await prisma.resume.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(firstResume).not.toBeNull();

    const secondFile = Buffer.from('second resume');

    const response = await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', secondFile, {
        filename: 'resume-new.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const secondResume = await prisma.resume.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(secondResume).not.toBeNull();

    expect(secondResume?.id).toBe(firstResume?.id);
    expect(secondResume?.fileName).toBe('resume-new.pdf');
    expect(secondResume?.fileSize).toBe(secondFile.length);

    expect(mockUpload).toHaveBeenCalledTimes(2);
  });

  it('should return 400 when resume file is missing', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Resume file is required');
  });

  it('should return 400 when file type is invalid', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake image'), {
        filename: 'profile.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Resume file must be PDF, DOC, or DOCX');

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 400 when file size exceeds 5 MB', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const largeFile = Buffer.alloc(5 * 1024 * 1024 + 1);

    const response = await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', largeFile, {
        filename: 'large-resume.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Resume file size must not exceed 5 MB');

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app)
      .post('/api/profile/resume')
      .attach('file', Buffer.from('fake pdf content'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });
});

describe('DELETE /api/profile/resume', () => {
  it('should delete the resume successfully', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const filePath = `resumes/${user.id}/resume-id.pdf`;

    await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: 'my-resume.pdf',
        filePath,
        mimeType: 'application/pdf',
        fileSize: 12345,
      },
    });

    const response = await request(app)
      .delete('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Resume deleted successfully');

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith([filePath]);

    const resume = await prisma.resume.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(resume).toBeNull();
  });

  it('should return 404 when user does not have a resume', async () => {
    const user = await createTestUser();

    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const response = await request(app)
      .delete('/api/profile/resume')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Resume not found');
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await request(app).delete('/api/profile/resume');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });
});
