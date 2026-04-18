import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/data-source';
import { Role } from '../../src/entities/Role';
import { User } from '../../src/entities/User';
import { hashPassword } from '../../src/utils/auth';
import { config } from '../../src/config';

describe('Auth API (Integration)', () => {
  let adminRole: Role;
  let adminUser: User;
  let adminAccessToken: string;

  beforeAll(async () => {
    // Ensure DB connection is initialized by jest.setup.ts
    // Create necessary roles and users for testing
    adminRole = await AppDataSource.getRepository(Role).save({ name: 'admin', description: 'Admin Role' });
    const hashedPassword = await hashPassword('AdminPass123!');
    adminUser = await AppDataSource.getRepository(User).save({
      email: 'auth_test_admin@example.com',
      password: hashedPassword,
      firstName: 'Auth',
      lastName: 'Test',
      role: adminRole,
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in a user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'AdminPass123!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.email).toBe(adminUser.email);
      adminAccessToken = res.body.accessToken; // Store for later tests
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid input (missing email)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'AdminPass123!' })
        .expect(400);

      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.email).toBe(adminUser.email);
      expect(res.body.role.name).toBe('admin');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 for unauthenticated access', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.message).toBe('No token provided.');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body.message).toBe('Invalid or expired token.');
    });
  });

  // Example of API test for Rate Limiting (requires multiple requests)
  describe('Rate Limiting on /api/auth/login', () => {
    it('should limit login attempts and return 429', async () => {
      const agent = request.agent(app); // Use agent to persist cookies if needed, though rate limit is IP based.

      // Make 5 successful/unsuccessful requests within the window to hit the limit (max: 5)
      for (let i = 0; i < config.app.nodeEnv === 'development' ? 5 : 5; i++) { // Jest runs in development
        await agent.post('/api/auth/login').send({ email: 'nonexistent@example.com', password: 'password' });
      }

      // The 6th request should be rate-limited
      const res = await agent.post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' })
        .expect(429);

      expect(res.text).toBe('Too many login attempts from this IP, please try again after 15 minutes');
    }, 20000); // Increase timeout for rate limit tests
  });
});