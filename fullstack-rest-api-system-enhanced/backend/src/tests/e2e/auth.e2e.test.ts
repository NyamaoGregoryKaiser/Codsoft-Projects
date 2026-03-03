import request from 'supertest';
import app from '../../app';
import { AppDataSource } from '../../database';
import { User, UserRole } from '../../database/entities/User';

describe('Auth E2E Tests', () => {
  let adminUser: User;
  let adminToken: string;

  beforeEach(async () => {
    // Ensure the database is clean from previous tests
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.clear(); // Clears all data from the users table

    // Register an admin user for testing authenticated routes
    const adminRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin_e2e@example.com',
        password: 'password123',
      });
    adminUser = adminRegisterRes.body.user;
    adminToken = adminRegisterRes.body.token;

    await userRepository.update(adminUser.id, { role: UserRole.ADMIN }); // Update role directly
    adminUser.role = UserRole.ADMIN;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'securepassword',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toEqual('john.doe@example.com');
      expect(res.body.user.role).toEqual(UserRole.USER); // Default role
      expect(res.body.user).not.toHaveProperty('password'); // Password excluded
    });

    it('should return 409 if email already exists', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'testpassword',
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'anotherpassword',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toEqual('User with this email already exists');
    });

    it('should return 400 for invalid registration data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Invalid',
          email: 'invalid-email', // Invalid email
          password: '123', // Too short password
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Please enter a valid email address');
      expect(res.body.message).toContain('Password must be at least 6 characters long');
      expect(res.body.message).toContain('Last name is required');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Login',
          lastName: 'User',
          email: 'login.user@example.com',
          password: 'loginpassword',
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login.user@example.com',
          password: 'loginpassword',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toEqual('login.user@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });

    it('should return 400 for invalid login data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bad-email',
          password: '123',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Please enter a valid email address');
      expect(res.body.message).toContain('Password must be at least 6 characters long');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(adminUser.id);
      expect(res.body.email).toEqual(adminUser.email);
      expect(res.body.role).toEqual(UserRole.ADMIN);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Not authorized, no token');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Not authorized, token failed');
    });
  });
});