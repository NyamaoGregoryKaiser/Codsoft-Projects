```javascript
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const connectDB = require('../../config/db');
const logger = require('../../config/winston');

// Mock connectDB to connect to a test database instead of the main one
jest.mock('../../config/db', () => jest.fn(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatdb_test';
  await mongoose.connect(uri);
  logger.info(`Test MongoDB Connected: ${uri}`);
}));

// Mock logger to prevent actual logging during tests
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();

let server;
let testUser;
let testUserToken;

beforeAll(async () => {
  // Ensure .env is loaded for tests
  require('dotenv').config({ path: './.env' });
  await connectDB();
  server = app.listen(5001); // Use a different port for tests
});

beforeEach(async () => {
  // Clear the database before each test
  await User.deleteMany({});
  testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123', // Mongoose pre-save hook will hash this
  });

  // Manually generate a token for testUser (useful for protected routes)
  testUserToken = testUser.getSignedJwtToken();
});

afterAll(async () => {
  await mongoose.connection.close();
  await server.close();
});

describe('Auth Routes Integration Tests', () => {
  // @desc      Register user
  // @route     POST /api/v1/auth/register
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'newpassword123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@example.com');

      const userInDb = await User.findOne({ email: 'newuser@example.com' });
      expect(userInDb).not.toBeNull();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'incomplete',
          email: 'incomplete@example.com',
        }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Please add a password');
    });

    it('should return 400 if email already exists', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'duplicate',
          email: 'test@example.com', // Already exists
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('User with that email already exists');
    });
  });

  // @desc      Login user
  // @route     POST /api/v1/auth/login
  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Invalid credentials');
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Invalid credentials');
    });
  });

  // @desc      Get current logged in user
  // @route     GET /api/v1/auth/me
  describe('GET /api/v1/auth/me', () => {
    it('should return the authenticated user\'s details', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', testUser._id.toString());
      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Not authorized to access this route');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Not authorized to access this route');
    });
  });

  // @desc      Log user out / clear cookie
  // @route     GET /api/v1/auth/logout
  describe('GET /api/v1/auth/logout', () => {
    it('should log out the user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      // For client-side JWT, the client is responsible for deleting the token.
      // The server just confirms the action.
    });

    it('should return 401 if no token is provided for logout', async () => {
      const res = await request(app)
        .get('/api/v1/auth/logout');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```