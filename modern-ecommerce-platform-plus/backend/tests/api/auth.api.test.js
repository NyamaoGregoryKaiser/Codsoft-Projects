const supertest = require('supertest');
const app = require('../../src/app');
const knex = require('../../src/database/knexfile');
const bcrypt = require('bcryptjs');

const request = supertest(app);

describe('Auth API Tests', () => {
  const newUser = {
    name: 'API Test User',
    email: 'api.test@example.com',
    password: 'password123',
  };
  const adminEmail = 'admin@example.com';
  const adminPassword = 'adminpassword'; // From seeds

  beforeAll(async () => {
    await knex.migrate.latest();
    // Ensure admin user exists, but don't re-seed on every run if already seeded
    const adminExists = await knex('users').where({ email: adminEmail }).first();
    if (!adminExists) {
        await knex.seed.run();
    }
  });

  afterAll(async () => {
    // Clean up test user created during tests
    await knex('users').where('email', newUser.email).del();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('access');
      expect(res.body.data.tokens).toHaveProperty('refresh');

      // Verify user in DB
      const userInDb = await knex('users').where({ email: newUser.email }).first();
      expect(userInDb).toBeDefined();
      expect(userInDb.name).toBe(newUser.name);
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    test('should return 400 if email is already registered', async () => {
      await request
        .post('/api/v1/auth/register')
        .send(newUser) // Use same user data
        .expect(400); // Expect bad request because email is duplicated
    });

    test('should return 400 for invalid registration data (e.g., missing password)', async () => {
      const invalidUser = { name: 'Invalid', email: 'invalid@example.com' };
      await request
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login user successfully with correct credentials', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({ email: newUser.email, password: newUser.password })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('email', newUser.email);
      expect(res.body.data).toHaveProperty('tokens');
    });

    test('should login admin user successfully with correct credentials', async () => {
        const res = await request
          .post('/api/v1/auth/login')
          .send({ email: adminEmail, password: adminPassword })
          .expect(200);

        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toHaveProperty('email', adminEmail);
        expect(res.body.data.user).toHaveProperty('role', 'admin');
        expect(res.body.data).toHaveProperty('tokens');
    });

    test('should return 401 for incorrect password', async () => {
      await request
        .post('/api/v1/auth/login')
        .send({ email: newUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    test('should return 401 for unregistered email', async () => {
      await request
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh-tokens', () => {
    let refreshToken;

    beforeAll(async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({ email: newUser.email, password: newUser.password });
      refreshToken = res.body.data.tokens.refresh.token;
    });

    test('should refresh access and refresh tokens successfully', async () => {
      const res = await request
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('access');
      expect(res.body.data.tokens).toHaveProperty('refresh');
      expect(res.body.data.tokens.access.token).not.toBe(refreshToken); // New access token
      expect(res.body.data.tokens.refresh.token).not.toBe(refreshToken); // New refresh token
    });

    test('should return 401 for an invalid refresh token', async () => {
      await request
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken: 'invalidtoken' })
        .expect(401);
    });
  });
});