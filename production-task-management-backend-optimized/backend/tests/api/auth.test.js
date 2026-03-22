```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const prisma = require('../../src/db/prisma');
const { hashPassword } = require('../../src/utils/bcrypt');
const { generateToken } = require('../../src/utils/jwt');
const redisClient = require('../../src/utils/redisClient');

describe('Auth routes', () => {
  let newUser;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    // Clear the database and seed for API tests if necessary
    // For `prisma test environment`, usually you'd use `prisma migrate reset --force`
    // For this example, we'll manually delete and create for simplicity.
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await hashPassword('Password123!');
    newUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await hashPassword('Admin123!'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    adminToken = generateToken(adminUser.id, adminUser.role);
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    // No need to disconnect redis in afterAll because globalTeardown will do it
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 and user info if registration is successful', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'Guy',
        })
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
      expect(res.body).toHaveProperty('token');

      // Clean up created user to ensure idempotency for tests
      await prisma.user.delete({ where: { id: res.body.user.id } });
    });

    it('should return 400 if email is already taken', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: newUser.email, // Use existing email
          password: 'Password123!',
          firstName: 'Another',
          lastName: 'User',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if validation fails (e.g., weak password)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid@example.com',
          password: 'short', // Weak password
          firstName: 'Invalid',
          lastName: 'User',
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 and user info if login is successful', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: 'Password123!',
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 if email is not found', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if password is incorrect', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: 'wrongpassword',
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should enforce rate limiting on login attempts', async () => {
      // Assuming RATE_LIMIT_MAX_REQUESTS is 5 in jest.setup.js
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'password' })
          .expect(httpStatus.UNAUTHORIZED); // Each attempt should still fail with UNAUTHORIZED
      }

      // 6th attempt should be rate limited
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' })
        .expect(httpStatus.TOO_MANY_REQUESTS);
    });
  });
});
```