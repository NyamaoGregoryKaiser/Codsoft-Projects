import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database/prisma-client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
const JWT_SECRET = process.env.JWT_SECRET!;

describe('Auth API E2E Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'API User',
          email: 'api@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('User registered successfully. Please login.');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.email).toBe('api@example.com');

      const userInDb = await prisma.user.findUnique({ where: { email: 'api@example.com' } });
      expect(userInDb).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short',
          email: 'invalid-email',
          password: '123',
          passwordConfirm: '123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Invalid email address/);
    });

    it('should return 400 for mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
          passwordConfirm: 'password321',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Passwords do not match');
    });

    it('should return 400 if email already registered', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing',
          email: 'existing@api.com',
          password: 'password123',
          passwordConfirm: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing Again',
          email: 'existing@api.com',
          password: 'password123',
          passwordConfirm: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Duplicate field value/); // Prisma error message
    });
  });

  describe('POST /api/auth/login', () => {
    let user: any;
    const userPassword = 'loginpassword';

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(userPassword, 12);
      user = await prisma.user.create({
        data: {
          name: 'Login User',
          email: 'loginuser@example.com',
          passwordHash: hashedPassword,
        },
      });
    });

    it('should log in a user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: userPassword,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe('loginuser@example.com');

      // Verify token
      const decoded: any = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.id).toBe(user.id);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userPassword,
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Incorrect email or password');
    });
  });
});