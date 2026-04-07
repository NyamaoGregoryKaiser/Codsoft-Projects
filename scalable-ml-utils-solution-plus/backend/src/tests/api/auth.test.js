```javascript
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const { setupTestDB, insertUsers, adminUser, regularUser, userOne } = require('../fixtures/db.fixture');
const config = require('../../config/config');
const jwt = require('jsonwebtoken');

describe('Auth API', () => {
  beforeAll(async () => {
    db.sequelize.options.database = 'ml_utilities_test_db';
    await setupTestDB();
  });

  beforeEach(async () => {
    await db.User.destroy({ truncate: true, cascade: true }); // Clear users
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user and return JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('newuser');
      expect(res.body.data.user.email).toBe('new@example.com');
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.password).toBeUndefined(); // Password should not be returned

      const user = await db.User.findOne({ where: { email: 'new@example.com' } });
      expect(user).not.toBeNull();
      expect(await user.isValidPassword('password123')).toBe(true);
    });

    test('should return 400 for duplicate email', async () => {
      await insertUsers([regularUser]);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'anotheruser',
          email: regularUser.email,
          password: 'password123',
          confirmPassword: 'password123',
        })
        .expect(400);

      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/exists/);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should log in an existing user and return JWT token', async () => {
      await insertUsers([regularUser]);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: regularUser.email,
          password: regularUser.password,
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(regularUser.email);
    });

    test('should return 401 for incorrect password', async () => {
      await insertUsers([regularUser]);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: regularUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    test('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should return the authenticated user\'s profile', async () => {
      const [user] = await insertUsers([userOne]);
      const token = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user.username).toBe(user.username);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('should return 401 if no token is provided', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });

    test('should return 401 for invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    test('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign({ id: 'some-id' }, config.jwt.secret, { expiresIn: '1ms' });
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for token to expire

      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});
```