import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from "bcrypt";

import app from '../src/app.js';
import { cleanDatabase, disconnectDatabase } from './helpers/database.js';
import prisma from '../src/config/prisma.js';
import { testUser, createTestUser } from './helpers/user.js';

describe('POST /api/auth/register', () => {
  beforeEach(cleanDatabase);

  afterAll(disconnectDatabase);

  it('should register a new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.data).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(response.body.data).not.toHaveProperty('password');

    const user = await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Test User");
    expect(user?.email).toBe("test@example.com");
    expect(user?.password).not.toBe("password123");

    const isPasswordValid = await bcrypt.compare(
      "password123",
      user!.password,
    );

    expect(isPasswordValid).toBe(true);
  });

  it('should return 400 when request is invalid', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
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
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'test@example.com',
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
  beforeEach(cleanDatabase);

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
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user).not.toHaveProperty('password');
    expect(response.body.data.accessToken).toEqual(
      expect.any(String),
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
