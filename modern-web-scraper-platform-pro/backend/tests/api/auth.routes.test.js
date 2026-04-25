```javascript
// backend/tests/api/auth.routes.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth API Endpoints', () => {
  let server;
  beforeAll(async () => {
    // Ensure the test database is clean and migrated
    await db.sequelize.sync({ force: true });
    server = app.listen(0); // Start the app on an ephemeral port
  });

  afterEach(async () => {
    await db.User.destroy({ where: {} }); // Clear users after each test
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close(); // Close the server
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'register@example.com',
        password: 'password123',
      };

      const res = await request(server)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toEqual(newUser.email);
      expect(res.body.role).toEqual('user'); // Default role
      expect(res.body).not.toHaveProperty('password'); // Password should not be returned

      const userInDb = await db.User.findByPk(res.body.id);
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    it('should return 400 if email is already registered', async () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'password123',
      };
      await db.User.create(existingUser);

      const res = await request(server)
        .post('/api/v1/auth/register')
        .send(existingUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Email already registered');
    });

    it('should return 400 if validation fails (e.g., invalid email)', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
      };

      const res = await request(server)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await db.User.create({
        email: 'login@example.com',
        password: 'password123', // Password will be hashed by model hook
        role: 'user',
      });
    });

    it('should log in a user and return a JWT token', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'password123',
      };

      const res = await request(server)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual(credentials.email);
      expect(res.body.user.role).toEqual(testUser.role);

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toEqual(testUser.id);
      expect(decoded.role).toEqual(testUser.role);
    });

    it('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'wrong_password',
      };

      const res = await request(server)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const res = await request(server)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });
  });
});
```