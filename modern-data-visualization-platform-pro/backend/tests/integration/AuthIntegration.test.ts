import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/db/data-source';
import { User } from '../../src/models/User';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config/env';

// This test suite runs against a real database (configured via setup.ts)
describe('Auth API (Integration Tests)', () => {
  let userRepository: Repository<User>;

  beforeAll(async () => {
    // AppDataSource is initialized and cleaned in tests/setup.ts before all tests.
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {
    // Clear users table before each test to ensure a clean state
    await userRepository.clear();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('token');

      const userInDb = await userRepository.findOne({ where: { email: 'test@example.com' } });
      expect(userInDb).toBeDefined();
      expect(userInDb!.username).toBe('testuser');
      expect(userInDb!.passwordHash).not.toBe('password123'); // Password should be hashed
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          // password missing
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Username, email, and password are required');
    });

    it('should return 400 if email already exists', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'user1', email: 'duplicate@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'user2', email: 'duplicate@example.com', password: 'password456' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User with this email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let registeredUser: User;
    let registeredPassword = 'loginpassword123';

    beforeEach(async () => {
      registeredUser = userRepository.create({
        username: 'loginuser',
        email: 'login@example.com',
        passwordHash: await require('bcryptjs').hash(registeredPassword, 10),
      });
      await userRepository.save(registeredUser);
    });

    it('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: registeredPassword });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Logged in successfully');
      expect(res.body.user).toHaveProperty('id', registeredUser.id);
      expect(res.body.user).toHaveProperty('email', 'login@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: registeredPassword });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let registeredUser: User;
    let authToken: string;

    beforeEach(async () => {
      registeredUser = userRepository.create({
        username: 'profileuser',
        email: 'profile@example.com',
        passwordHash: await require('bcryptjs').hash('profilepassword', 10),
      });
      await userRepository.save(registeredUser);
      authToken = jwt.sign({ id: registeredUser.id }, JWT_SECRET!, { expiresIn: '1h' });
    });

    it('should return the authenticated user\'s profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', registeredUser.id);
      expect(res.body).toHaveProperty('username', 'profileuser');
      expect(res.body).toHaveProperty('email', 'profile@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'No authentication token provided');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid authentication token');
    });
  });
});