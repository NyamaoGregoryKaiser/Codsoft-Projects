```typescript
import request from 'supertest';
import app from '../../app'; // Import your Express app
import prisma from '../../database/prisma';
import { UserRole } from '@prisma/client';
import config from '../../config';
import jwt from 'jsonwebtoken';

describe('Auth API Endpoints', () => {
  const testUser = {
    email: 'api_test@example.com',
    password: 'Password123!',
  };
  const adminUser = {
    email: 'api_admin@example.com',
    password: 'AdminPassword123!',
  };

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.role).toBe(UserRole.USER);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not register with an existing email', async () => {
      await request(app).post('/api/auth/register').send(testUser); // First registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Error');
      expect(res.body.error).toBe('User with this email already exists');
    });

    it('should return 400 for invalid input (email)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Validation Error');
      expect(res.body.error).toEqual(expect.arrayContaining([expect.stringContaining('"email" must be a valid email')]));
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Ensure user exists for login test
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login a user and return a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');

      // Verify token
      const decoded = jwt.verify(res.body.data.token, config.jwt.secret) as jwt.JwtPayload;
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(UserRole.USER);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Error');
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Error');
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send(adminUser);
      const loginRes = await request(app).post('/api/auth/login').send(adminUser);
      authToken = loginRes.body.data.token;
    });

    it('should return current user details for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(adminUser.email);
      expect(res.body.data.role).toBe(UserRole.ADMIN);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me'); // No token

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Not authorized, no token provided');
    });

    it('should return 401 if invalid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Not authorized, token failed');
    });
  });
});
```