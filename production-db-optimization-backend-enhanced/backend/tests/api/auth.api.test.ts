import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany(); // Clear users before tests
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'registertest@example.com',
          password: 'password123',
          firstName: 'Register',
          lastName: 'User',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('registertest@example.com');
      expect(res.body.user.role).toBe(UserRole.USER);

      const user = await prisma.user.findUnique({ where: { email: 'registertest@example.com' } });
      expect(user).toBeDefined();
      expect(await bcrypt.compare('password123', user!.password)).toBe(true);
    });

    it('should return 400 if email is already taken', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: await bcrypt.hash('password123', 10),
          role: UserRole.USER,
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'newpassword',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email already taken');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'incomplete@example.com' }); // Missing password
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('password is required');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userCredentials = {
      email: 'logintest@example.com',
      password: 'testpassword',
    };

    beforeAll(async () => {
      await prisma.user.deleteMany({ where: { email: userCredentials.email } }); // Clean up if previous test failed
      await prisma.user.create({
        data: {
          email: userCredentials.email,
          password: await bcrypt.hash(userCredentials.password, 10),
          firstName: 'Login',
          lastName: 'User',
          role: UserRole.USER,
        },
      });
    });

    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(userCredentials);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(userCredentials.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userCredentials.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userCredentials.email }); // Missing password
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('password is required');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token: string;
    let userId: string;

    beforeAll(async () => {
      await prisma.user.deleteMany({ where: { email: 'metest@example.com' } });
      const user = await prisma.user.create({
        data: {
          email: 'metest@example.com',
          password: await bcrypt.hash('password', 10),
          role: UserRole.ADMIN,
        },
      });
      userId = user.id;

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'metest@example.com', password: 'password' });
      token = loginRes.body.token;
    });

    it('should return the authenticated user\'s information', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.email).toBe('metest@example.com');
      expect(res.body.user.role).toBe(UserRole.ADMIN);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Authentication token missing');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid authentication token');
    });
  });
});
```