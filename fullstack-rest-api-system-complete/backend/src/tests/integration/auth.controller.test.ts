import request from 'supertest';
import express from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import authRoutes from '../../routes/auth.routes';
import { HttpException } from '../../utils/http-exception';
import { errorMiddleware } from '../../middleware/error.middleware';
import { rateLimitMiddleware } from '../../middleware/rateLimit.middleware';

// Mock AuthService
jest.mock('../../services/auth.service');
const mockAuthService = new AuthService() as jest.Mocked<AuthService>;

// Setup a minimal Express app for testing routes with error middleware
const app = express();
app.use(express.json());
app.use(rateLimitMiddleware); // Add rate limit, though unlikely to trigger in single tests
app.use('/api/auth', authRoutes);
app.use(errorMiddleware); // Global error handler

describe('AuthController Integration', () => {
  describe('POST /api/auth/register', () => {
    it('should return 201 and user data on successful registration', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockResult = {
        user: { id: 'uuid1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'user' },
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      };
      mockAuthService.register.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
    });

    it('should return 409 if email is already registered', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      mockAuthService.register.mockRejectedValue(new HttpException(409, 'Email already registered.'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe('Email already registered.');
    });

    it('should return 400 for invalid registration data (e.g., missing email)', async () => {
      const registerData = {
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      // For DTO validation, service method won't even be called
      // We are testing controller's interaction with `class-validator`
      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 500 for a generic server error during registration', async () => {
      const registerData = {
        email: 'error@example.com',
        password: 'password123',
        firstName: 'Error',
        lastName: 'User',
      };
      mockAuthService.register.mockRejectedValue(new Error('Internal server issue'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Registration failed.'); // Generic message from service or error middleware
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockResult = {
        user: { id: 'uuid1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'user' },
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = { email: 'wrong@example.com', password: 'wrongpassword' };
      mockAuthService.login.mockRejectedValue(new HttpException(401, 'Invalid credentials.'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 for invalid login data (e.g., missing password)', async () => {
      const loginData = { email: 'test@example.com' };
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Password must be at least 8 characters long');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should return 200 and a new access token on successful refresh', async () => {
      const refreshTokenData = { refreshToken: 'validRefreshToken' };
      mockAuthService.refreshToken.mockResolvedValue({ accessToken: 'newMockAccessToken' });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(refreshTokenData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ accessToken: 'newMockAccessToken' });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('validRefreshToken');
    });

    it('should return 400 if no refresh token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Refresh token is required.');
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should return 403 for an invalid refresh token', async () => {
      const refreshTokenData = { refreshToken: 'invalidRefreshToken' };
      mockAuthService.refreshToken.mockRejectedValue(new HttpException(403, 'Invalid refresh token.'));

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(refreshTokenData);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('Invalid refresh token.');
    });
  });
});