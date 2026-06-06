```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const { generateToken } = require('../../src/config/jwt');
const moment = require('moment');
const config = require('../../src/config');
const bcrypt = require('bcryptjs');

// Helper to clean database
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeAll(async () => {
  await cleanUpDb();
});

afterEach(async () => {
  await cleanUpDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth Routes', () => {
  describe('POST /v1/auth/register', () => {
    it('should return 201 and user info with tokens if registration is successful', async () => {
      const newUser = {
        name: 'Test User',
        email: 'register@example.com',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user).not.toHaveProperty('password'); // Password should be omitted
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');

      const userInDb = await prisma.user.findUnique({ where: { id: res.body.user.id } });
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    it('should return 400 if email is already registered', async () => {
      const user = await userService.createUser({ name: 'Existing', email: 'exist@example.com', password: 'Password123!' });

      await request(app)
        .post('/v1/auth/register')
        .send({ name: 'Another User', email: user.email, password: 'AnotherPassword!' })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if validation fails (e.g., invalid email)', async () => {
      await request(app)
        .post('/v1/auth/register')
        .send({ name: 'Invalid', email: 'invalid-email', password: 'Password123!' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login', () => {
    let testUser;
    beforeEach(async () => {
      testUser = await userService.createUser({ name: 'Login User', email: 'login@example.com', password: 'LoginPassword123!', role: 'USER' });
    });

    it('should return 200 and tokens if login is successful', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: 'LoginPassword123!' })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 if credentials are incorrect', async () => {
      await request(app)
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(httpStatus.UNAUTHORIZED);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'LoginPassword123!' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if validation fails (e.g., missing email)', async () => {
      await request(app)
        .post('/v1/auth/login')
        .send({ password: 'LoginPassword123!' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    let testUser;
    let oldTokens;
    beforeEach(async () => {
      testUser = await userService.createUser({ name: 'Refresh User', email: 'refresh@example.com', password: 'RefreshPassword123!', role: 'USER' });
      // Manually generate tokens for a fresh start or use login endpoint
      oldTokens = {
        accessToken: generateToken(testUser.id, moment().add(1, 'minute'), 'access'),
        refreshToken: generateToken(testUser.id, moment().add(config.jwt.refreshExpirationDays, 'days'), 'refresh'),
      };
    });

    it('should return 200 and new tokens if refresh token is valid', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: oldTokens.refreshToken })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.accessToken).not.toBe(oldTokens.accessToken);
      expect(res.body.refreshToken).not.toBe(oldTokens.refreshToken);
    });

    it('should return 401 if refresh token is expired', async () => {
      const expiredRefreshToken = generateToken(testUser.id, moment().subtract(1, 'day'), 'refresh');

      await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: expiredRefreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refresh token is invalid', async () => {
      await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if refresh token is an access token', async () => {
      await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: oldTokens.accessToken }) // Sending access token as refresh token
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
```