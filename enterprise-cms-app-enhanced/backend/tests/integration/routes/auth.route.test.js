const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const db = require('../../../src/models');
const bcrypt = require('bcryptjs');

describe('Auth routes', () => {
  let newUser;

  beforeAll(async () => {
    // Clear test database before all tests
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear users table before each test
    await db.User.destroy({ truncate: true, cascade: true });
    newUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    };
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 and user data if registration is successful', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user.password).not.toBeDefined(); // Password should be hashed and not returned
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.access).toBeDefined();
      expect(res.body.tokens.refresh).toBeDefined();

      const dbUser = await db.User.findOne({ where: { email: newUser.email } });
      expect(dbUser).toBeDefined();
      expect(await bcrypt.compare(newUser.password, dbUser.password)).toBe(true);
    });

    it('should return 400 if email is already taken', async () => {
      await db.User.create(newUser);

      await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if required fields are missing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Invalid User' }) // Missing email and password
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/login', () => {
    let userInDb;

    beforeEach(async () => {
      userInDb = await db.User.create(newUser);
    });

    it('should return 200 and tokens if login is successful', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: newUser.password })
        .expect(httpStatus.OK);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.tokens).toBeDefined();
    });

    it('should return 401 if email is incorrect', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: newUser.password })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if password is incorrect', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: 'wrongpassword' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  // Add tests for other routes (users, posts, categories, media) with authentication
});