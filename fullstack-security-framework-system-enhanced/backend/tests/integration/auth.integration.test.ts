import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import { prisma } from '../../src/models/prisma';
import { hashPassword } from '../../src/utils/password';
import { env } from '@config/env';
import { AuthMessages } from '@constants/messages';
import { UserRoles } from '@constants/roles';

describe('Auth Routes', () => {
  let adminUser: any;
  let adminPassword = 'adminPassword123!';
  let normalUser: any;
  let normalPassword = 'userPassword123!';

  beforeAll(async () => {
    // Create test users
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin_test@example.com',
        password: await hashPassword(adminPassword),
        role: UserRoles.ADMIN,
      },
    });

    normalUser = await prisma.user.create({
      data: {
        name: 'User Test',
        email: 'user_test@example.com',
        password: await hashPassword(normalPassword),
        role: UserRoles.USER,
      },
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and successfully register user if request data is valid', async () => {
      const newUser = {
        name: 'New User',
        email: 'new_user@example.com',
        password: 'Password123!',
      };
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.message).toBe(AuthMessages.REGISTRATION_SUCCESS);
      expect(res.body.data.user).toMatchObject({
        email: newUser.email,
        name: newUser.name,
        role: UserRoles.USER,
      });

      const dbUser = await prisma.user.findUnique({ where: { email: newUser.email } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(newUser.email);
    });

    it('should return 400 if email is invalid', async () => {
      const newUser = {
        name: 'New User',
        email: 'invalid-email',
        password: 'Password123!',
      };
      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 409 if email is already taken', async () => {
      const newUser = {
        name: 'Another User',
        email: adminUser.email, // Use existing email
        password: 'Password123!',
      };
      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CONFLICT);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and set auth cookies if login is successful', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminUser.email, password: adminPassword })
        .expect(httpStatus.OK);

      expect(res.body.message).toBe(AuthMessages.LOGIN_SUCCESS);
      expect(res.body.data.user).toMatchObject({ email: adminUser.email });
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain(env.jwtCookieNameAccess);
      expect(res.headers['set-cookie'][1]).toContain(env.jwtCookieNameRefresh);
    });

    it('should return 401 if login fails due to invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminUser.email, password: 'wrongpassword' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 and clear auth cookies on successful logout', async () => {
      // First, log in to get cookies
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: normalUser.email, password: normalPassword })
        .expect(httpStatus.OK);

      const cookies = loginRes.headers['set-cookie'];

      // Then, logout with cookies
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(httpStatus.OK);

      expect(logoutRes.body.message).toBe(AuthMessages.LOGOUT_SUCCESS);
      expect(logoutRes.headers['set-cookie'][0]).toContain(`${env.jwtCookieNameAccess}=;`);
      expect(logoutRes.headers['set-cookie'][1]).toContain(`${env.jwtCookieNameRefresh}=;`);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should return 200 and new access/refresh tokens if refresh token is valid', async () => {
      // Login to get initial tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: normalUser.email, password: normalPassword });
      const cookies = loginRes.headers['set-cookie'];

      // Extract refresh token cookie
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith(env.jwtCookieNameRefresh));

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [refreshTokenCookie])
        .expect(httpStatus.OK);

      expect(res.body.message).toBe(AuthMessages.ACCESS_TOKEN_REFRESHED);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain(env.jwtCookieNameAccess);
      expect(res.headers['set-cookie'][1]).toContain(env.jwtCookieNameRefresh);
      expect(res.body.data.user).toMatchObject({ email: normalUser.email });

      // Verify old refresh token is invalidated (by checking in DB)
      const oldRefreshTokenValue = refreshTokenCookie.split(';')[0].split('=')[1];
      const oldTokenInDb = await prisma.token.findFirst({ where: { token: oldRefreshTokenValue }});
      expect(oldTokenInDb).toBeNull();
    });

    it('should return 401 if refresh token is missing or invalid', async () => {
      await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect(httpStatus.UNAUTHORIZED); // Missing refresh token
    });
  });
});