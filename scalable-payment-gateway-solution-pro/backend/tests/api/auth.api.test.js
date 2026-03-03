const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { db } = require('../../src/config/db');
const userService = require('../../src/modules/users/user.service');

describe('Auth routes', () => {
  beforeEach(async () => {
    // Clear the users table before each test
    await db('payments').del();
    await db('transactions').del();
    await db('accounts').del();
    await db('users').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and successfully register user if data is ok', async () => {
      const newUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
      };
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user.email).toBe(newUser.email);
    });

    it('should return 400 if email is already taken', async () => {
      const newUser = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
      };
      await userService.createUser(newUser); // Create user directly

      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser) // Try to register with same email
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if password is weak', async () => {
        const newUser = {
            firstName: 'Weak',
            lastName: 'Pass',
            email: 'weakpass@example.com',
            password: 'pass', // Too short and no special chars/numbers
        };
        await request(app)
            .post('/api/v1/auth/register')
            .send(newUser)
            .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let registeredUser;
    beforeEach(async () => {
      registeredUser = await userService.createUser({
        firstName: 'Login',
        lastName: 'User',
        email: 'login@example.com',
        password: 'Password123!',
      });
    });

    it('should return 200 and auth tokens if login is successful', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should return 401 if email is incorrect', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'Password123!' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if password is incorrect', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'WrongPassword!' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});