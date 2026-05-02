const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/models/prisma');
const bcrypt = require('bcryptjs');

// Clear database before each test
beforeEach(async () => {
  await prisma.prediction.deleteMany();
  await prisma.trainingJob.deleteMany();
  await prisma.model.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.user.deleteMany();
});

describe('Auth API Integration Tests', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('test1@example.com');
    expect(res.body.user.role).toBe('USER');

    const userInDb = await prisma.user.findUnique({ where: { email: 'test1@example.com' } });
    expect(userInDb).not.toBeNull();
    expect(await bcrypt.compare('password123', userInDb.password)).toBe(true);
  });

  it('should not register a user with an existing email', async () => {
    // First register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      });

    // Try to register again with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        email: 'test2@example.com',
        password: 'anotherpassword',
      });

    expect(res.statusCode).toEqual(409); // Conflict
    expect(res.body.message).toBe('User with this email already exists');
  });

  it('should login a registered user successfully', async () => {
    // Register a user first
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
      });

    // Then try to login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should get authenticated user profile', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123',
      });
    const token = registerRes.body.token;

    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.statusCode).toEqual(200);
    expect(profileRes.body.email).toBe('profile@example.com');
    expect(profileRes.body).toHaveProperty('id');
    expect(profileRes.body).toHaveProperty('username');
    expect(profileRes.body).not.toHaveProperty('password'); // Ensure password is not exposed
  });

  it('should not get profile without token', async () => {
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });
});