import request from 'supertest';
import app from '../../src/app'; // Your Express app
import { AppDataSource } from '../../src/database/data-source';
import { User } from '../../src/entities/User';
import { hashPassword } from '../../src/utils/password';

// Use a separate test database or ensure transactions for isolation
beforeAll(async () => {
  await AppDataSource.initialize();
  // Clear user table before tests
  await AppDataSource.getRepository(User).delete({});
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Auth API Integration', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('test@example.com');

    const userInDb = await AppDataSource.getRepository(User).findOneBy({ email: 'test@example.com' });
    expect(userInDb).not.toBeNull();
    expect(userInDb?.passwordHash).not.toBe('password123'); // Password should be hashed
  });

  it('should not register a user with existing email', async () => {
    // Attempt to register again with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(409); // Conflict
    expect(res.body.message).toBe('User with that email or username already exists');
  });

  it('should log in an existing user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should not log in with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});