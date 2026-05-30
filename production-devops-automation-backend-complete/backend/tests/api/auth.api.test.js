```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { v4: uuidv4 } = require('uuid');

// Mock logger to prevent console spam during tests
jest.mock('../../src/config/logger.config', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('Auth API', () => {
  beforeEach(async () => {
    // Clean up users before each test that interacts with auth
    await User.destroy({ where: { email: { [sequelize.Op.like]: '%@example.com' } } });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe('newuser');
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user.role).toBe('user');
      expect(res.body).toHaveProperty('token');

      const userInDb = await User.findOne({ where: { email: 'newuser@example.com' } });
      expect(userInDb).not.toBeNull();
      expect(await userInDb.comparePassword('password123')).toBe(true);
    });

    it('should return 400 if email already exists', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'existing',
          email: 'existing@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'duplicate',
          email: 'existing@example.com',
          password: 'password456',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('User with that email already exists.');
    });

    it('should return 400 for invalid input data (Joi validation)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'us', // Too short
          email: 'invalid-email',
          password: '123', // Too short
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('"username" length must be at least 3 characters long');
      expect(res.body.message).toContain('"email" must be a valid email');
      expect(res.body.message).toContain('"password" length must be at least 6 characters long');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let registeredUser;
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123',
        });
      registeredUser = res.body.user;
    });

    it('should log in a registered user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Logged in successfully');
      expect(res.body.user.id).toBe(registeredUser.id);
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com', // Pre-seeded user in setup.js
          password: 'password123',
        });
      token = res.body.token;
    });

    it('should return current user details with a valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username');
      expect(res.body.user).toHaveProperty('role');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me'); // No Authorization header

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid or expired token');
    });

    it('should return 401 for an expired token', async () => {
      const expiredToken = jwt.sign({ id: uuidv4(), role: 'user' }, config.jwt.secret, { expiresIn: '1s' });
      await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for token to expire

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Your token has expired! Please log in again.');
    });
  });
});
```