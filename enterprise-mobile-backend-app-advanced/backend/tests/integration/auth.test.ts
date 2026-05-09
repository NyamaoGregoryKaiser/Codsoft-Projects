import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import { UserRole } from '@prisma/client';

describe('Auth API Endpoints', () => {
  let accessToken: string;
  let refreshToken: string;

  const userCredentials = {
    email: 'integration@example.com',
    password: 'password123',
    name: 'Integration User',
  };

  const adminCredentials = {
    email: 'admin_integration@example.com',
    password: 'adminpassword',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    // Ensure test database is clean before running tests
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();

    // Create an admin user for later tests
    await request(app)
      .post('/api/v1/auth/register')
      .send(adminCredentials)
      .expect(201);
  });

  afterAll(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userCredentials)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(userCredentials.email);
      expect(res.body.data.name).toBe(userCredentials.name);
      expect(res.body.data.role).toBe(UserRole.USER);
    });

    it('should return 400 if email is already registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userCredentials)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Email already registered');
    });

    it('should return 400 for invalid input (e.g., missing email)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'password123', name: 'Invalid User' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation Error');
      expect(res.body.error.details[0].path).toBe('body.email');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in a registered user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(userCredentials)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged in successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userCredentials.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Incorrect email or password');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Incorrect email or password');
    });
  });

  describe('POST /api/v1/auth/refresh-tokens', () => {
    it('should refresh access and refresh tokens using a valid refresh token', async () => {
      expect(refreshToken).toBeDefined(); // Ensure login has occurred

      const res = await request(app)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Tokens refreshed successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.accessToken).not.toBe(accessToken); // New access token
      expect(res.body.data.refreshToken).not.toBe(refreshToken); // New refresh token

      accessToken = res.body.data.accessToken; // Update for subsequent tests
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 401 for an invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid refresh token');
    });

    it('should return 401 if refresh token is expired/not found in DB (already used or explicitly expired)', async () => {
      // Simulate an expired or already-used token by making a refresh request again with the old token
      const res = await request(app)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken: 'this_is_an_old_or_expired_token_that_wont_exist_in_db' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Refresh token expired or invalid');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should log out a user by deleting their refresh token', async () => {
      expect(refreshToken).toBeDefined();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Attempt to use the refresh token again, should fail
      const failedRefresh = await request(app)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(401);
      expect(failedRefresh.body.error.message).toBe('Refresh token expired or invalid');
    });

    it('should return 404 if refresh token not found', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'nonexistent-refresh-token' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Refresh token not found');
    });
  });
});