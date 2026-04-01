import request from 'supertest';
import { AppDataSource } from '../../config/database';
import App from '../../app';
import { User } from '../../models/User.entity';
import { seedDatabase } from '../../database/seeds';
import { config } from '../../config';
import logger from '../../utils/logger';

// Use a separate test database
process.env.DB_NAME = process.env.DB_TEST_NAME || 'horizon_pms_test_db';
process.env.NODE_ENV = 'test';

let server: any;
let app: App;

describe('Auth API E2E', () => {
  beforeAll(async () => {
    // Suppress logger output during tests
    logger.transports.forEach((t) => (t.silent = true));

    // Initialize database for tests
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    await AppDataSource.initialize();
    await AppDataSource.runMigrations(); // Ensure migrations are run

    // Seed data
    await seedDatabase();

    // Start the Express server
    app = new App();
    server = app.app.listen(config.port);
  });

  afterAll(async () => {
    // Clear test database
    await AppDataSource.dropDatabase();
    await AppDataSource.destroy();

    // Close the server
    server.close();

    // Restore logger output
    logger.transports.forEach((t) => (t.silent = false));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'securepassword123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual('newuser@example.com');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      // Verify user exists in DB
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email: 'newuser@example.com' } });
      expect(user).toBeDefined();
      expect(user?.firstName).toEqual('New');
    });

    it('should return 409 if email already registered', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'john.doe@example.com', // Already seeded user
          password: 'securepassword123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toEqual('Email already in use');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email', // Invalid email
          password: 'short', // Too short
          firstName: 'A',
          lastName: 'B',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid email format');
      expect(res.body.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual('john.doe@example.com');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials.');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials.');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });
      refreshToken = loginRes.body.refreshToken;
    });

    it('should return a new access token for a valid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 403 for an invalid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Invalid refresh token.');
    });

    it('should return 400 if no refresh token is provided', async () => {
      const res = await request(server)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Refresh token is required.');
    });
  });
});