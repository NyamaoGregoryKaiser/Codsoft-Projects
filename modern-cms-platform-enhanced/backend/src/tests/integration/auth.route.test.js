```javascript
const request = require('supertest');
const httpStatus = require('http-status-codes');
const app = require('../../app');
const sequelize = require('../../config/sequelize');
const { User } = require('../../models');
const config = require('../../config/config');

describe('Auth routes', () => {
  let newUser;

  beforeEach(async () => {
    // Clear and re-create tables for each test
    await sequelize.sync({ force: true });
    // Re-create test admin
    await User.create({
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'password123',
      role: 'admin',
    });

    newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'viewer',
    };
  });

  describe('POST /v1/auth/register', () => {
    test('should return 201 and user info if registration is successful', async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(newUser.username);
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user.role).toBe(newUser.role);
      expect(res.body.user.password).not.toBe(newUser.password); // Password should be hashed
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.access.token).toBeDefined();
      expect(res.body.tokens.refresh.token).toBeDefined();
    });

    test('should return 400 if email is already taken', async () => {
      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Email already taken');
    });

    test('should return 400 if username is already taken', async () => {
      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);
      const res = await request(app).post('/v1/auth/register').send({ ...newUser, email: 'another@example.com' }).expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Username already taken');
    });

    test('should return 400 if validation fails (e.g., weak password)', async () => {
      const invalidUser = { ...newUser, password: '123' }; // Too short
      const res = await request(app).post('/v1/auth/register').send(invalidUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toMatch(/password must be at least 8 characters/i);
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);
    });

    test('should return 200 and tokens if login is successful', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: newUser.email, password: newUser.password })
        .expect(httpStatus.OK);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.access.token).toBeDefined();
      expect(res.body.tokens.refresh.token).toBeDefined();
    });

    test('should return 401 if email is incorrect', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'wrong@example.com', password: newUser.password })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Incorrect email or password');
    });

    test('should return 401 if password is incorrect', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: newUser.email, password: 'wrongpassword' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Incorrect email or password');
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser);
      refreshToken = res.body.tokens.refresh.token;
    });

    test('should return 200 and new tokens if refresh token is valid', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.OK);

      expect(res.body.access.token).toBeDefined();
      expect(res.body.refresh.token).toBeDefined();
    });

    test('should return 401 if refresh token is invalid', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: 'invalidtoken' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Please authenticate');
    });

    test('should return 401 if refresh token is missing', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({})
        .expect(httpStatus.BAD_REQUEST); // Joi validation for required refreshToken

      expect(res.body.message).toBe('"refreshToken" is required');
    });
  });
});
```