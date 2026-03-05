const request = require('supertest');
const app = require('../../app');
const knex = require('../../db/knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth API Integration Tests', () => {
  let testUser;
  let adminToken;

  beforeEach(async () => {
    // Clear users table and re-seed an admin user for each test
    await knex('users').del();
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const [adminUser] = await knex('users').insert({
      username: 'admin',
      email: 'admin@test.com',
      password_hash: hashedPassword,
      role: 'admin',
    }).returning('*');
    adminToken = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      password_hash: await bcrypt.hash('testpassword', 10),
    };
    await knex('users').insert({
      username: testUser.username,
      email: testUser.email,
      password_hash: testUser.password_hash,
      role: 'user',
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'newpassword',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('newuser@example.com');
      expect(res.body.role).toBe('user');

      const userInDb = await knex('users').where({ email: 'newuser@example.com' }).first();
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare('newpassword', userInDb.password_hash)).toBe(true);
    });

    test('should return 409 if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existing',
          email: testUser.email,
          password: 'password',
        });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with that email already exists');
    });

    test('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
          password: 'password',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Please enter all fields');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(testUser.email);
    });

    test('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    test('should return 401 for invalid credentials (email not found)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return authenticated user details', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('role');
      expect(res.body).not.toHaveProperty('password_hash');
      expect(res.body).not.toHaveProperty('token');
    });

    test('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    test('should return 401 if invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
    });
  });
});