```typescript
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/db';
import { User, UserRole } from '../models/User';
import { config } from '../config/config';
import jwt from 'jsonwebtoken';

describe('Auth API', () => {
  let user1: User;
  let adminUser: User;
  let accessToken: string;
  let adminAccessToken: string;

  beforeEach(async () => {
    // Create a regular user
    const userRepo = AppDataSource.getRepository(User);
    user1 = userRepo.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    });
    await user1.hashPassword();
    await userRepo.save(user1);

    // Create an admin user
    adminUser = userRepo.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: UserRole.ADMIN,
    });
    await adminUser.hashPassword();
    await userRepo.save(adminUser);

    accessToken = jwt.sign({ id: user1.id }, config.JWT_SECRET, { expiresIn: '1h' });
    adminAccessToken = jwt.sign({ id: adminUser.id }, config.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'newpassword123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('User registered successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toEqual('newuser');
      expect(res.body.user.email).toEqual('newuser@example.com');
      expect(res.body.user.role).toEqual('user');
      expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should return 409 if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'test@example.com', // Existing email
          password: 'password123',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toEqual('User with this email already exists');
    });

    it('should return 409 if username already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser', // Existing username
          email: 'another@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toEqual('User with this username already exists');
    });

    it('should return 400 for invalid input (e.g., short password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'shortpass@example.com',
          password: '123', // Too short
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Validation failed');
      expect(res.body.data[0].message).toContain('Password must be at least 6 characters long');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user successfully and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Logged in successfully');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token using a valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      const refreshToken = loginRes.body.refreshToken;

      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(refreshRes.statusCode).toEqual(200);
      expect(refreshRes.body).toHaveProperty('accessToken');
    });

    it('should return 401 for an invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid or expired refresh token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', user1.id);
      expect(res.body).toHaveProperty('email', user1.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Not authorized, no token');
    });

    it('should return 401 if invalid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer invalid.token.here`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Not authorized, token failed');
    });
  });
});
```