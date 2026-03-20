import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import app from '../../src/app';
import { connectDB, getDbDataSource } from '../../src/config/database';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/User';
import { RefreshToken } from '../../src/entities/RefreshToken';
import { jwtConfig } from '../../src/config/jwt';
import jwt from 'jsonwebtoken';

describe('Auth API Integration Tests', () => {
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let userPayload: { email: string; password: string };
  let adminPayload: { email: string; password: string };

  beforeAll(async () => {
    // Ensure DB is connected, and in test env, use a separate test database if possible.
    // For simplicity, we'll use the same DB but clear it.
    process.env.NODE_ENV = 'test';
    process.env.DB_DATABASE = 'auth_test_db'; // Use a dedicated test database name
    await connectDB();
    const dataSource = getDbDataSource();
    userRepository = dataSource.getRepository(User);
    refreshTokenRepository = dataSource.getRepository(RefreshToken);
  });

  beforeEach(async () => {
    // Clear the database before each test
    await refreshTokenRepository.query('TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE;');
    await userRepository.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');

    userPayload = { email: 'test@user.com', password: 'Password123' };
    adminPayload = { email: 'admin@user.com', password: 'AdminPassword123' };
  });

  afterAll(async () => {
    // Clean up test database
    await refreshTokenRepository.query('TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE;');
    await userRepository.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    await getDbDataSource().destroy();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userPayload)
        .expect(StatusCodes.CREATED);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('email', userPayload.email);
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie

      const userInDb = await userRepository.findOne({ where: { email: userPayload.email }, select: ['id', 'email', 'role'] });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.email).toBe(userPayload.email);

      const refreshTokenInDb = await refreshTokenRepository.findOne({ where: { userId: userInDb?.id } });
      expect(refreshTokenInDb).not.toBeNull();
    });

    it('should return 400 if email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(userPayload); // Register once

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userPayload)
        .expect(StatusCodes.BAD_REQUEST);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User with this email already exists.');
    });

    it('should return 400 for invalid input (e.g., weak password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid@example.com', password: 'short' })
        .expect(StatusCodes.BAD_REQUEST);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(userPayload);
    });

    it('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(userPayload)
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Logged in successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('email', userPayload.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userPayload.email, password: 'wrongpassword' })
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid credentials.');
    });

    it('should return 400 for invalid input (e.g., missing password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userPayload.email, password: '' })
        .expect(StatusCodes.BAD_REQUEST);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Password cannot be empty');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(userPayload);
      refreshToken = res.headers['set-cookie'][0].split(';')[0].split('refreshToken=')[1];
    });

    it('should refresh access token using a valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Tokens refreshed successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined(); // New refresh token
      expect(res.headers['set-cookie'][0]).not.toContain(refreshToken); // Ensure refresh token is rotated

      // Verify old refresh token is revoked in DB
      const oldRefreshTokenInDb = await refreshTokenRepository.findOne({ where: { token: refreshToken } });
      expect(oldRefreshTokenInDb?.isRevoked).toBe(true);
    });

    it('should return 401 if no refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No refresh token provided');
    });

    it('should return 401 if refresh token is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalidtoken'])
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid or expired refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(userPayload);
      refreshToken = res.headers['set-cookie'][0].split(';')[0].split('refreshToken=')[1];
    });

    it('should logout a user by revoking refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Logged out successfully');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;'); // Cookie should be cleared

      const refreshTokenInDb = await refreshTokenRepository.findOne({ where: { token: refreshToken } });
      expect(refreshTokenInDb?.isRevoked).toBe(true);
    });

    it('should clear cookie even if no refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .expect(StatusCodes.OK); // Still returns 200, but logs a warning

      expect(res.body.status).toBe('success');
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  describe('GET /api/v1/auth/profile (protected)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(userPayload);
      accessToken = res.body.data.accessToken;
      refreshToken = res.headers['set-cookie'][0].split(';')[0].split('refreshToken=')[1];
    });

    it('should return user profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email', userPayload.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 if no access token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Not authorized, no token');
    });

    it('should return 401 if access token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Not authorized, token failed');
    });

    it('should return 401 if access token is expired (and refresh mechanism might kick in for frontend)', async () => {
      const expiredAccessToken = jwt.sign(
        { id: 'someid', email: 'exp@example.com', role: 'user' },
        jwtConfig.secret,
        { expiresIn: '1ms' }
      );

      // Wait a bit for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${expiredAccessToken}`)
        // We do not send refresh token here, simulating an API call without automatic refresh
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Not authorized, token failed');
    });
  });

  describe('GET /api/v1/auth/admin-dashboard (authorization)', () => {
    let userAccessToken: string;
    let adminAccessToken: string;

    beforeEach(async () => {
      // Register a regular user
      const userRes = await request(app).post('/api/v1/auth/register').send(userPayload);
      userAccessToken = userRes.body.data.accessToken;

      // Register an admin user (directly manipulate DB for simplicity in test)
      const adminUser = userRepository.create({
        email: adminPayload.email,
        password: 'hashedadminpassword', // Password will be hashed by entity method
        role: 'admin' as any, // Cast to UserRole.ADMIN
      });
      adminUser.password = await adminUser.hashPassword(adminPayload.password);
      await userRepository.save(adminUser);

      adminAccessToken = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessExpiration }
      );
    });

    it('should allow access for admin users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-dashboard')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('admin dashboard');
      expect(res.body.user.role).toBe('admin');
    });

    it('should deny access for regular users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-dashboard')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(StatusCodes.FORBIDDEN);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('not authorized to access this route');
    });

    it('should deny access if no token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-dashboard')
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No token');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(userPayload);
    });

    it('should return 200 and generic message for existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: userPayload.email })
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('If an account with that email exists');
    });

    it('should return 200 and generic message for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(StatusCodes.OK); // For security, we don't leak if email exists

      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('If an account with that email exists');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(StatusCodes.BAD_REQUEST);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Must be a valid email address');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let createdUser: User;
    let resetToken: string;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(userPayload);
      const userId = regRes.body.data.user.id;
      createdUser = (await userRepository.findOne({ where: { id: userId }, select: ['id', 'email', 'password', 'role'] })) as User;
      resetToken = `dummy_reset_token_for_${createdUser.id}_${Date.now()}`; // Mock a valid token
    });

    it('should reset password successfully with a valid token', async () => {
      const newPassword = 'NewSecurePassword123';
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: newPassword })
        .expect(StatusCodes.OK);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Password has been reset successfully');

      // Verify password changed
      const updatedUser = (await userRepository.findOne({ where: { id: createdUser.id }, select: ['id', 'email', 'password'] })) as User;
      expect(await updatedUser.comparePassword(newPassword)).toBe(true);
      expect(await updatedUser.comparePassword(userPayload.password)).toBe(false);
    });

    it('should return 401 for an invalid reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid_token_format', password: 'NewSecurePassword123' })
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid reset token format');
    });

    it('should return 401 for an expired reset token', async () => {
      const expiredToken = `dummy_reset_token_for_${createdUser.id}_${Date.now() - (2 * 60 * 60 * 1000)}`; // 2 hours ago
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: expiredToken, password: 'NewSecurePassword123' })
        .expect(StatusCodes.UNAUTHORIZED);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Reset token expired');
    });

    it('should return 400 for weak new password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: 'short' })
        .expect(StatusCodes.BAD_REQUEST);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests for auth endpoints', async () => {
      // Assuming authRateLimiter is set to max 5 requests per 15 minutes
      const testEmail = 'rate-limit-test@example.com';
      const testPassword = 'RateLimitPassword123';

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: testEmail, password: testPassword })
          .expect(StatusCodes.UNAUTHORIZED); // Expect invalid credentials, but not rate limited
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(StatusCodes.TOO_MANY_REQUESTS); // 6th request should be rate limited

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Too many login attempts from this IP');
    }, 20000); // Increase timeout for rate limit test
  });
});