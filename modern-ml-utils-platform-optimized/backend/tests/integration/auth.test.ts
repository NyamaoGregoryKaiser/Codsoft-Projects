import request from 'supertest';
import app from '../../src/app';
import AppDataSource from '../../src/database/datasource';
import { User } from '../../src/modules/users/entities/User';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('Auth Routes', () => {
  let userRepository: any;

  beforeAll(async () => {
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {
    // Clear users table before each test
    await userRepository.query('DELETE FROM users;');
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'register@example.com',
          password: 'password123',
          firstName: 'Register',
          lastName: 'User',
        })
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('register@example.com');
      expect(res.body.user).not.toHaveProperty('password'); // Password should be excluded
      expect(await userRepository.count()).toBe(1);

      const createdUser = await userRepository.findOne({ where: { email: 'register@example.com' }, select: ['password'] });
      expect(createdUser).not.toBeNull();
      expect(await bcrypt.compare('password123', createdUser!.password)).toBe(true);
    });

    it('should return 400 if email is already taken', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await userRepository.save(userRepository.create({ email: 'duplicate@example.com', password: hashedPassword }));

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(res.body.message).toBe('Email already taken');
      expect(await userRepository.count()).toBe(1);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@example.com',
          // No password
        })
        .expect(400); // Or 500 if validation is not handled
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser: User;
    const testEmail = 'login@example.com';
    const testPassword = 'password123';

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await userRepository.save(userRepository.create({
        id: uuidv4(),
        email: testEmail,
        password: hashedPassword,
        firstName: 'Login',
        lastName: 'User',
      }));
    });

    it('should log in an existing user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(res.body.message).toBe('Incorrect email or password');
    });
  });
});