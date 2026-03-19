import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prismaClient';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/config';
import bcrypt from 'bcryptjs';
import cache from '../../src/utils/cache';

// Re-mock cache for integration tests as global setup mocks it.
// This is to ensure it doesn't actually cache, but we can verify calls if needed.
jest.mock('../../src/utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushAll: jest.fn(),
}));

describe('Auth API Integration Tests', () => {
  // Clear mock calls after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user.name).toBe(newUser.name);
      expect(res.body.user.role).toBe('USER');

      // Clean up the created user
      await prisma.user.delete({ where: { email: newUser.email } });
    });

    it('should return 409 if user with email already exists', async () => {
      const existingUser = {
        email: 'admin@test.com', // Using a seeded user
        password: 'password123',
        name: 'Admin Test',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(existingUser)
        .expect(409);

      expect(res.body).toHaveProperty('message', 'User with this email already exists.');
    });

    it('should return 400 for invalid input (e.g., missing password)', async () => {
      const invalidUser = {
        email: 'invalid@test.com',
        name: 'Invalid User',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Password must be at least 6 characters long');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user and return a JWT token', async () => {
      const loginCredentials = {
        email: 'user@test.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toHaveProperty('id', 'auth-test-user-id');
      expect(res.body.user).toHaveProperty('email', loginCredentials.email);

      // Verify the token
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.id).toBe('auth-test-user-id');
      expect(decoded.email).toBe(loginCredentials.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginCredentials = {
        email: 'user@test.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should return 401 if user does not exist', async () => {
      const loginCredentials = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should return 400 for invalid input (e.g., missing email)', async () => {
      const invalidLogin = {
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidLogin)
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid email address');
    });
  });
});