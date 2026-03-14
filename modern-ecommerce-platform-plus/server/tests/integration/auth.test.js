```javascript
// server/tests/integration/auth.test.js
const request = require('supertest');
const httpStatus = require('http-status-codes');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const bcrypt = require('bcryptjs');

describe('Auth Routes', () => {
  let newUser;
  let adminUser;
  const password = 'password123';

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create an admin user for testing
    const hashedPassword = await bcrypt.hash(password, 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin_test@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Register User
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: password,
        })
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');

      newUser = res.body.user; // Store for later tests
    });

    it('should return 400 if email already registered', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Test User',
          email: 'testuser@example.com',
          password: password,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if invalid data provided', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Incomplete',
          email: 'invalid-email', // Invalid email format
          password: '123', // Too short password
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  // Login User
  describe('POST /api/auth/login', () => {
    it('should log in a user successfully and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: password,
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword',
        })
        .expect(httpStatus.UNAUTHORIZED);

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: password,
        })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  // Get Profile
  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      // Login to get a valid token for authenticated routes
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: password });
      token = loginRes.body.token;
    });

    it('should return the authenticated user\'s profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(httpStatus.OK);

      expect(res.body.email).toBe('testuser@example.com');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.id).toBe(newUser.id);
    });

    it('should return 401 if no token is provided', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if an invalid token is provided', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  // Update Profile
  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: password });
      token = loginRes.body.token;
    });

    it('should update the authenticated user\'s profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(httpStatus.OK);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.email).toBe('testuser@example.com');

      // Verify in DB
      const userInDb = await prisma.user.findUnique({ where: { id: newUser.id } });
      expect(userInDb.name).toBe('Updated Name');
    });

    it('should return 401 if no token is provided', async () => {
      await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Unauthorized Update' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should not allow updating role', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' })
        .expect(httpStatus.OK); // Update will succeed, but role change ignored

      expect(res.body.role).toBe('USER'); // Role should remain USER

      // Verify in DB
      const userInDb = await prisma.user.findUnique({ where: { id: newUser.id } });
      expect(userInDb.role).toBe('USER');
    });
  });
});
```