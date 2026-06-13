const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Auth API Integration Tests', () => {
  let testUser;
  let testAdmin;

  beforeEach(async () => {
    // Clear and re-sync database before each test
    await User.sequelize.sync({ force: true });

    // Create a user for login tests
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      id: uuidv4(),
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'subscriber',
      status: 'active',
    });

    // Create an admin user for specific tests
    const adminHashedPassword = await bcrypt.hash('adminpassword', 10);
    testAdmin = await User.create({
      id: uuidv4(),
      username: 'testadmin',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'admin',
      status: 'active',
    });
  });

  // --- Register Endpoint ---
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'securepassword',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toMatchObject({
        username: newUser.username,
        email: newUser.email,
        role: 'subscriber',
      });
      expect(res.body.data.token).toBeDefined();

      const createdUser = await User.findOne({ where: { email: newUser.email } });
      expect(createdUser).toBeDefined();
      expect(await createdUser.validPassword(newUser.password)).toBe(true);
    });

    it('should return 400 if email already exists', async () => {
      const duplicateUser = {
        username: 'anotheruser',
        email: 'test@example.com', // Existing email
        password: 'password123',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User with this email already exists.');
    });

    it('should return 400 for invalid input (e.g., missing password)', async () => {
      const invalidUser = {
        username: 'invalid',
        email: 'invalid@example.com',
        // password is missing
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('"password" is required');
    });

    it('should return 403 if non-admin tries to set a role other than subscriber', async () => {
        const newUser = {
            username: 'privilegedUser',
            email: 'privileged@example.com',
            password: 'securepassword',
            role: 'editor', // Attempt to set editor role
        };
        const res = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe('Forbidden: You cannot set a custom role during registration.');
    });

    it('should allow admin to register new user with a specific role', async () => {
        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testAdmin.email, password: 'adminpassword' });
        const adminToken = adminLoginRes.body.data.token;

        const newUser = {
            username: 'editorUser',
            email: 'editor@example.com',
            password: 'editorpassword',
            role: 'editor',
        };
        const res = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user.role).toBe('editor');
    });
  });

  // --- Login Endpoint ---
  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
      });
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid input (e.g., missing email)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('"email" is required');
    });
  });

  // --- Get Me Endpoint ---
  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      token = res.body.data.token;
    });

    it('should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
      });
      expect(res.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Authentication token missing or malformed');
    });

    it('should return 403 if invalid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid token');
    });
  });
});