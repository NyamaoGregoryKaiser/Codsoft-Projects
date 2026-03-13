```typescript
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/users/user.entity';
import bcrypt from 'bcrypt';
import { UserRole } from '../../src/shared/enums';
import { Repository } from 'typeorm';

describe('Auth API Integration Tests', () => {
  let userRepository: Repository<User>;
  let testUser: User;
  const testUserPassword = 'testpassword123';

  beforeAll(async () => {
    await AppDataSource.synchronize(true); // Re-sync schema for clean slate in tests
    userRepository = AppDataSource.getRepository(User);

    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = userRepository.create({
      username: 'testuser',
      password: hashedPassword,
      role: UserRole.USER,
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await userRepository.delete({}); // Clean up test user
    // No need to close AppDataSource, setup.ts handles it
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/users/register') // Using /users/register, as auth doesn't handle registration directly
        .send({
          username: 'newuser',
          password: 'newuserpassword',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('username', 'newuser');
      expect(res.body.data).toHaveProperty('role', UserRole.USER);

      const userInDb = await userRepository.findOneBy({ username: 'newuser' });
      expect(userInDb).not.toBeNull();
      if (userInDb) {
        expect(await bcrypt.compare('newuserpassword', userInDb.password)).toBe(true);
      }
    });

    it('should return 409 if username already exists', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser', // Existing user
          password: 'anotherpassword',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('User with this username already exists');
    });

    it('should return 400 for invalid registration data (e.g., short password)', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'invaliduser',
          password: 'short', // Too short
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Validation failed');
      expect(res.body.errors).toContain('body.password - Password must be at least 8 characters long');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUserPassword,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id', testUser.id);
      expect(res.body.user).toHaveProperty('username', testUser.username);
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Invalid credentials');
    });

    it('should return 400 for invalid login data (e.g., missing password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Validation failed');
      expect(res.body.errors).toContain('body.password - Required');
    });
  });
});
```