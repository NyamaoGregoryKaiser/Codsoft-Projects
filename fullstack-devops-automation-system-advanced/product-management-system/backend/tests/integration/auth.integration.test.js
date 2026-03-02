const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const bcrypt = require('bcryptjs');

// Mock Redis cache operations to avoid actual Redis connection during integration tests
jest.mock('../../src/utils/cache', () => ({
  getOrSetCache: jest.fn((key, cb) => cb()), // Always call the callback directly
  invalidateCache: jest.fn()
}));

describe('Auth routes', () => {
  beforeAll(async () => {
    // Sync database and clear tables before running tests
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Clear all tables after each test
    await User.destroy({ truncate: true, cascade: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /v1/auth/register', () => {
    it('should return 201 and user data if registration is successful', async () => {
      const newUser = {
        username: 'registertest',
        email: 'register@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('token');

      const dbUser = await User.findByPk(res.body.userId);
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toEqual(newUser.email);
      expect(await dbUser.isPasswordMatch(newUser.password)).toBe(true);
    });

    it('should return 400 if email is already taken', async () => {
      const newUser = {
        username: 'testuser1',
        email: 'taken@example.com',
        password: 'password123'
      };
      await User.create(newUser); // Create user first

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toEqual('Email already taken');
    });

    it('should return 400 if username is already taken', async () => {
      const newUser = {
        username: 'takenusername',
        email: 'test@example.com',
        password: 'password123'
      };
      await User.create(newUser); // Create user first

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...newUser, email: 'newemail@example.com' }) // Change email to avoid email collision
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toEqual('Username already taken');
    });
  });

  describe('POST /v1/auth/login', () => {
    let testUser;
    beforeEach(async () => {
      // Create a user for login tests
      testUser = await User.create({
        username: 'logintest',
        email: 'login@example.com',
        password: 'loginpassword'
      });
      // The `beforeSave` hook in user.model.js hashes the password
    });

    it('should return 200 and auth token if login is successful', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'loginpassword' })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('userId', testUser.id);

      const decoded = jwt.verify(res.body.token, config.jwt.secret);
      expect(decoded.sub).toEqual(testUser.id);
    });

    it('should return 401 if email is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'loginpassword' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toEqual('Incorrect email or password');
    });

    it('should return 401 if password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toEqual('Incorrect email or password');
    });
  });

  describe('GET /v1/users/profile', () => {
    let testUser, authToken;
    beforeEach(async () => {
      testUser = await User.create({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'profilepassword'
      });
      authToken = jwt.sign({ sub: testUser.id, iat: Math.floor(Date.now() / 1000) }, config.jwt.secret, { expiresIn: '1h' });
    });

    it('should return 200 and user profile if authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('id', testUser.id);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign({ sub: testUser.id, iat: Math.floor(Date.now() / 1000) - 3600 }, config.jwt.secret, { expiresIn: '1s' });
      // Wait a bit to ensure token is expired if needed, though '1s' usually works
      await new Promise(resolve => setTimeout(resolve, 1100));

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toEqual('Authentication token expired');
    });
  });
});
```

```