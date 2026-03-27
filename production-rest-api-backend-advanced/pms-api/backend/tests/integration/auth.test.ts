import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/db/data-source';
import { User, UserRole } from '../../src/modules/users/user.entity';
import { hashPassword } from '../../src/utils/password';
import config from '../../src/config';

describe('Auth API (Integration)', () => {
  let adminUser: User;
  let memberUser: User;
  let adminPassword = 'AdminPassword123!';
  let memberPassword = 'MemberPassword123!';

  beforeAll(async () => {
    // Ensure DB is clean and has admin user
    const userRepository = AppDataSource.getRepository(User);
    
    // Clear users table
    await userRepository.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);

    // Create admin user
    const hashedAdminPassword = await hashPassword(adminPassword);
    adminUser = userRepository.create({
      username: 'adminTest',
      email: 'admintest@example.com',
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);

    // Create a regular member user
    const hashedMemberPassword = await hashPassword(memberPassword);
    memberUser = userRepository.create({
      username: 'memberTest',
      email: 'membertest@example.com',
      password: hashedMemberPassword,
      role: UserRole.MEMBER,
    });
    await userRepository.save(memberUser);
  });

  afterEach(async () => {
    // Clean up created users if any in specific tests, though global users remain
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete({ email: 'newuser@example.com' });
    await userRepository.delete({ email: 'newuser2@example.com' });
  });

  // --- Register Endpoint Tests ---
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with default member role', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
      };
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toEqual(newUser.username);
      expect(res.body.user.email).toEqual(newUser.email);
      expect(res.body.user.role).toEqual(UserRole.MEMBER); // Default role
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        username: 'missingEmail',
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Username, email, and password are required.');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        username: 'shortpass',
        email: 'shortpass@example.com',
        password: '123',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Password must be at least 6 characters long.');
    });

    it('should return 409 if email already exists', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        username: 'existingEmailUser',
        email: adminUser.email, // Use existing admin email
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with this email already exists.');
    });

    it('should return 409 if username already exists', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        username: adminUser.username, // Use existing admin username
        email: 'anotheremail@example.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with this username already exists.');
    });
  });

  // --- Login Endpoint Tests ---
  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: adminUser.email,
        password: adminPassword,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.id).toEqual(adminUser.id);
      expect(res.body.user.email).toEqual(adminUser.email);
      expect(res.body.user.role).toEqual(adminUser.role);
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: adminUser.email,
        password: 'wrongpassword',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        password: 'Password123!',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email and password are required.');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: adminUser.email,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email and password are required.');
    });
  });
});
```

#### `pms-api/backend/tests/integration/user.test.ts`
```typescript