import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import app from '../../app';
import { AppDataSource } from '../../database';
import { User, UserRole } from '../../database/entities/User.entity';
import { Cart } from '../../database/entities/Cart.entity';

describe('Auth API', () => {
  const userRepository = AppDataSource.getRepository(User);
  const cartRepository = AppDataSource.getRepository(Cart);

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'register@example.com',
        password: 'Password123',
      };

      const res = await request(app).post('/api/v1/auth/register').send(userData);

      expect(res.statusCode).toEqual(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.role).toBe(UserRole.USER);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');

      const userInDb = await userRepository.findOne({ where: { email: userData.email } });
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(userData.email);

      const cartInDb = await cartRepository.findOne({ where: { user: { id: userInDb?.id } } });
      expect(cartInDb).toBeDefined();
    });

    it('should return 409 if email is already registered', async () => {
      const userData = {
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'Password123',
      };
      await request(app).post('/api/v1/auth/register').send(userData); // First registration

      const res = await request(app).post('/api/v1/auth/register').send(userData); // Second registration

      expect(res.statusCode).toEqual(StatusCodes.CONFLICT);
      expect(res.body.message).toBe('Email already registered');
    });

    it('should return 400 for invalid input data', async () => {
      const invalidUserData = {
        firstName: 'Test',
        email: 'invalid-email', // Invalid email format
        password: 'short', // Too short password
      };

      const res = await request(app).post('/api/v1/auth/register').send(invalidUserData);

      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(res.body.message).toContain('email must be a valid email');
      expect(res.body.message).toContain('password length must be at least 8 characters long');
      expect(res.body.message).toContain('firstName is required');
      expect(res.body.message).toContain('lastName is required');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser: User;
    let testUserPassword = 'SecurePassword123';

    beforeEach(async () => {
      testUser = userRepository.create({
        firstName: 'Login',
        lastName: 'User',
        email: 'login@example.com',
        password: testUserPassword, // Password will be hashed by service
        role: UserRole.USER,
      });
      await testUser.save();
    });

    it('should login a user and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUserPassword,
      });

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword',
      });

      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      });

      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toBe('Incorrect email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;
    let testUser: User;

    beforeEach(async () => {
      testUser = userRepository.create({
        firstName: 'Auth',
        lastName: 'Me',
        email: 'authme@example.com',
        password: 'AuthMePassword123',
        role: UserRole.USER,
      });
      await testUser.save();

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'AuthMePassword123',
      });
      accessToken = loginRes.body.tokens.accessToken;
    });

    it('should return the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.firstName).toBe(testUser.firstName);
      expect(res.body.role).toBe(testUser.role);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toBe('Authentication required');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toBe('Invalid or expired token');
    });
  });
});