```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { generateToken } = require('../../src/utils/helpers');

describe('Auth API Integration Tests', () => {
  // Test user data from setup.js
  const adminUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    username: 'testadmin',
    email: 'testadmin@example.com',
    password: 'adminpassword', // Raw password for login
  };
  const regularUser = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'userpassword', // Raw password for login
  };

  let adminToken;
  let userToken;

  beforeAll(() => {
    adminToken = generateToken(adminUser.id);
    userToken = generateToken(regularUser.id);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual(newUser.email);
      expect(res.body.role).toEqual('user');

      // Clean up created user for idempotent tests
      await User.destroy({ where: { email: newUser.email } });
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: adminUser.email,
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('User already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incomplete',
          email: 'incomplete@example.com',
        }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Please enter all fields');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: regularUser.password,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual(regularUser.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid email or password');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
        }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Please enter all fields');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the authenticated user\'s profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(regularUser.id);
      expect(res.body.email).toEqual(regularUser.email);
      expect(res.body).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Not authorized, no token');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('Not authorized, token failed');
    });
  });
});
```