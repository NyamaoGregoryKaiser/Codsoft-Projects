```typescript
import request from 'supertest';
import { AppDataSource } from '../../database';
import app from '../../app';
import { User } from '../../modules/users/user.entity';
import { AppError } from '../../utils/appError';

describe('Auth API', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
    // Clean user table before running tests
    await AppDataSource.getRepository(User).delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const testUser = {
    name: 'Auth Test User',
    email: 'authtest@example.com',
    password: 'authtestpassword',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
        role: 'user',
      });
      expect(res.body.data.user.id).toBeDefined();
    });

    it('should not register with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser); // Use the same user data

      expect(res.statusCode).toEqual(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('User with that email already exists');
    });

    it('should return 400 for missing registration data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Incomplete', email: 'incomplete@example.com' }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('password is a required field');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in a registered user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'anypassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 400 for missing login credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email }); // Missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Please provide email and password!');
    });
  });

  // Example for a protected route (requires token)
  describe('GET /api/v1/users (protected)', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      authToken = loginRes.body.token;
    });

    it('should allow access to admin for protected route', async () => {
      // First, promote the testUser to admin for this test
      const userRepo = AppDataSource.getRepository(User);
      const userToPromote = await userRepo.findOneBy({ email: testUser.email });
      if (userToPromote) {
        userToPromote.role = 'admin';
        await userRepo.save(userToPromote);
      }

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should deny access without token', async () => {
      const res = await request(app)
        .get('/api/v1/users');

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should deny access with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid token. Please log in again!');
    });
  });
});
```