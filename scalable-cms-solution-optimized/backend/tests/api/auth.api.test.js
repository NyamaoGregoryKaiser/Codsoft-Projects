const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');
const bcrypt = require('bcryptjs');
const config = require('../../src/config/config');
const jwt = require('jsonwebtoken');

describe('Auth API Endpoints', () => {
  let server;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    // Ensure we are in a test environment
    process.env.NODE_ENV = 'test';
    // Sync models to the test database
    await sequelize.sync({ force: true }); // Clear and recreate tables
    server = app.listen(0); // Listen on a random available port

    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword', config.bcryptSaltRounds);
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'viewer',
      isActive: true,
    });

    const adminHashedPassword = await bcrypt.hash('adminpassword', config.bcryptSaltRounds);
    testAdmin = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'admin',
      isActive: true,
    });
  });

  afterAll(async () => {
    await server.close(); // Close the server
    await sequelize.close(); // Close the database connection
  });

  afterEach(async () => {
    // Clean up or reset data if needed after each test
  });

  // --- POST /api/auth/register ---
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newuserpassword',
        role: 'editor',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', newUser.username);
      expect(res.body.user).toHaveProperty('email', newUser.email);
      expect(res.body.user).toHaveProperty('role', newUser.role);
      expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
      expect(res.body).toHaveProperty('token');

      // Verify user actually created in DB
      const userInDb = await User.findByPk(res.body.user.id);
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    it('should return 409 if username already exists', async () => {
      const newUser = {
        username: testUser.username, // Existing username
        email: 'anotheremail@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User with this email or username already exists');
    });

    it('should return 409 if email already exists', async () => {
      const newUser = {
        username: 'anotherusername',
        email: testUser.email, // Existing email
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User with this email or username already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'incomplete' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter all required fields: username, email, password');
    });
  });

  // --- POST /api/auth/login ---
  describe('POST /api/auth/login', () => {
    it('should login an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'testpassword' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged in successfully');
      expect(res.body.user).toHaveProperty('id', testUser.id);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'anypassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter email and password');
    });

    it('should return 403 if user account is inactive', async () => {
      const inactiveUser = await User.create({
        username: 'inactive',
        email: 'inactive@example.com',
        password: await bcrypt.hash('inactivepass', config.bcryptSaltRounds),
        role: 'viewer',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: inactiveUser.email, password: 'inactivepass' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User account is inactive. Please contact support.');

      await inactiveUser.destroy();
    });
  });

  // --- GET /api/auth/me ---
  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(() => {
      token = jwt.sign({ id: testUser.id }, config.jwtSecret, { expiresIn: '1h' });
    });

    it('should return the authenticated user\'s profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', testUser.id);
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('should return 401 if a token for a non-existent user is provided', async () => {
      const nonExistentToken = jwt.sign({ id: 'non-existent-uuid' }, config.jwtSecret, { expiresIn: '1h' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${nonExistentToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, user not found');
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign({ id: testUser.id }, config.jwtSecret, { expiresIn: '1s' });
      // Wait for a short moment to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Token expired');
    });
  });
});
```