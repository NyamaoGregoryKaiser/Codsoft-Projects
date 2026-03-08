```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const db = require('../../src/data-access/db');
const { userRepository } = require('../../src/data-access/repositories');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Auth routes', () => {
  beforeAll(async () => {
    // Clear the database before tests
    await db('users').del();
  });

  afterAll(async () => {
    // Clear the database after all tests
    await db('users').del();
    await db.destroy(); // Close database connection
  });

  let userOne;
  let userOnePassword = 'password123';
  let userTwo = {
    id: uuidv4(),
    email: 'user2@example.com',
    password: 'password456',
    first_name: 'User',
    last_name: 'Two'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and user info if registration is successful', async () => {
      const newUser = {
        email: 'test@example.com',
        password: userOnePassword,
        firstName: 'Test',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user).not.toHaveProperty('password'); // Password should be hashed
      expect(res.body.user.email).toBe(newUser.email);
      userOne = res.body.user;

      const dbUser = await userRepository.findByEmail(newUser.email);
      expect(dbUser).toBeDefined();
      expect(await bcrypt.compare(newUser.password, dbUser.password)).toBe(true);
    });

    it('should return 400 if email is already taken', async () => {
      const newUser = {
        email: userOne.email, // Already registered
        password: 'newpassword',
        firstName: 'Another',
        lastName: 'User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if password is too short', async () => {
      const newUser = {
        email: 'shortpass@example.com',
        password: 'short', // Min 8 chars
        firstName: 'Short',
        lastName: 'Pass'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and tokens if login is successful', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userOne.email, password: userOnePassword })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user.email).toBe(userOne.email);
      expect(res.body.tokens).toHaveProperty('accessToken');
    });

    it('should return 401 if email is incorrect', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: userOnePassword })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if password is incorrect', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userOne.email, password: 'wrongpassword' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;
    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userOne.email, password: userOnePassword });
      accessToken = loginRes.body.tokens.accessToken;
    });

    it('should return 200 and current user info if authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(userOne.id);
      expect(res.body.email).toBe(userOne.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 204 on successful logout', async () => {
      // First log in to establish a session
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userOne.email, password: userOnePassword })
        .expect(httpStatus.OK);

      // Then log out
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(httpStatus.NO_CONTENT);

      // Verify session is destroyed (e.g., trying to access protected route without new login)
      // This is harder to test directly without checking session store, but response code is a good indicator.
    });
  });
});
```