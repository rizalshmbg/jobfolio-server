import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from "bcrypt";

import app from '../src/app.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import prisma from '../src/config/prisma.js';
import { testUser, createTestUser } from './helpers/user.js';
import { hashRefreshToken } from '../src/utils/refresh-token.js';

beforeEach(cleanDatabase);
afterAll(disconnectDatabase);

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.data).toMatchObject({
      name: testUser.name,
      email: testUser.email,
    });
    expect(response.body.data).not.toHaveProperty('password');

    const user = await prisma.user.findUnique({
      where: {
        email: testUser.email,
      },
    });

    expect(user).not.toBeNull();

    if (!user) {
      throw new Error('User was not created');
    }

    expect(user.name).toBe(testUser.name);
    expect(user.email).toBe(testUser.email);
    expect(user.password).not.toBe(testUser.password);

    const isPasswordValid = await bcrypt.compare(
      testUser.password,
      user.password,
    );

    expect(isPasswordValid).toBe(true);
  });

  it('should return 400 when request is invalid', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: testUser.name,
      email: 'invalid-email',
      password: testUser.password,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation error');

    const userCount = await prisma.user.count();

    expect(userCount).toBe(0);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'email',
        }),
      ]),
    );
  });

  it('should return 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
    });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: testUser.email,
      password: 'anotherpassword123',
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email already registered');

    const userCount = await prisma.user.count();

    expect(userCount).toBe(1);
  });
});

describe("POST /api/auth/login", () => {
  it("should login successfully", async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.data.user).toMatchObject({
      name: testUser.name,
      email: testUser.email,
    });
    expect(response.body.data.user).not.toHaveProperty('password');
    expect(response.body.data.accessToken).toEqual(
      expect.any(String),
    );
    expect(response.body.data).not.toHaveProperty('refreshToken');


    // Cookie check
    const refreshCookie = response.headers['set-cookie']?.[0];

    if (!refreshCookie) {
      throw new Error('Refresh token cookie was not set');
    }

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('refreshToken=');
    expect(refreshCookie).toContain('HttpOnly');


    // raw refresh token
    const rawRefreshToken = refreshCookie.split(';')[0]?.split('=')[1];

    if (!rawRefreshToken) {
      throw new Error(
        'Refresh token was not found in cookie',
      );
    }

    // Session check
    const session = await prisma.session.findFirst({
      where: {
        user: {
          email: testUser.email,
        },
      },
    });

    // if session was not created
    if (!session) {
      throw new Error('Session was not created');
    }

    expect(session).not.toBeNull();
    expect(session?.expiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(session.tokenHash).not.toBe(rawRefreshToken)
    expect(session.tokenHash).toBe(
      hashRefreshToken(rawRefreshToken),
    );
  });

  it('should return 401 when password is incorrect', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email or password is incorrect');
  });

  it('should return 401 when email is not registered', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'notfound@example.com',
      password: testUser.password,
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email or password is incorrect');
  });
});

describe("POST /api/auth/refresh", () => {
  it("should refresh access token successfully", async () => {
    await createTestUser();

    // create agent because agent have cookie jar
    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);

    // refresh access token
    const response = await agent.post('/api/auth/refresh');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Access token refreshed successfully');
    expect(response.body.data.accessToken).toEqual(
      expect.any(String),
    );
    expect(response.body.data).not.toHaveProperty(
      'refreshToken',
    );

    const refreshCookie = response.headers['set-cookie']?.[0];

    if (!refreshCookie) {
      throw new Error('New refresh token cookie was not set');
    }

    expect(refreshCookie).toContain('refreshToken=');
    expect(refreshCookie).toContain('HttpOnly');
  });

  it("should return 401 when refresh access token is missing", async () => {
    const response = await request(app).post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });

  it("should return 401 when refresh access token is invalid", async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Unauthorized');
  });

  it("should invalidate old refresh token after rotation", async () => {
    await createTestUser();

    // login and get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);

    // get old refresh cookie
    const oldRefreshCookie = loginResponse.headers['set-cookie']?.[0];

    // if old refresh cookie is not set
    if (!oldRefreshCookie) {
      throw new Error('Refresh token cookie was not set');
    }

    // refresh access token with old refresh cookie
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldRefreshCookie);

    // expect refresh response
    expect(refreshResponse.status).toBe(200);

    // reuse old refresh token
    const reuseResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldRefreshCookie);

    expect(reuseResponse.status).toBe(401);
    expect(reuseResponse.body.success).toBe(false);
    expect(reuseResponse.body.message).toBe('Unauthorized');
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    await createTestUser();

    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);

    const sessionBeforeLogout = await prisma.session.findFirst();

    expect(sessionBeforeLogout).not.toBeNull();

    const response = await agent.post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logout successful');

    const sessionAfterLogout = await prisma.session.findFirst();

    expect(sessionAfterLogout).toBeNull();

    // get logout cookie
    const logoutCookie = response.headers['set-cookie']?.[0];

    if (!logoutCookie) {
      throw new Error('Refresh token cookie was not cleared');
    }

    expect(logoutCookie).toContain('refreshToken=');

    // refresh token after logout
    const refreshResponse = await agent.post('/api/auth/refresh');

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.success).toBe(false);
    expect(refreshResponse.body.message).toBe('Unauthorized');
  });

  it('should return 200 when refresh token is missing', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logout successful');
  });
});
