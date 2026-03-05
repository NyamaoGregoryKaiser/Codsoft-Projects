const supertest = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user');
const { faker } = require('@faker-js/faker');

const request = supertest(app);

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database and synchronize models
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Clean up users table after each test
    await User.destroy({ truncate: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should register a new user', async () => {
    const userData = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: 'testpassword123',
    };

    const res = await request.post('/api/auth/register').send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.username).toBe(userData.username);
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.user).not.toHaveProperty('password'); // Password should be excluded
  });

  it('should not register a user with existing email', async () => {
    const email = faker.internet.email();
    await request.post('/api/auth/register').send({
      username: faker.internet.userName(),
      email: email,
      password: 'testpassword123',
    });

    const res = await request.post('/api/auth/register').send({
      username: faker.internet.userName(),
      email: email,
      password: 'anotherpassword',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status', 'fail');
    expect(res.body.message).toContain('Duplicate field value:');
  });

  it('should log in an existing user', async () => {
    const userData = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: 'testpassword123',
    };
    await request.post('/api/auth/register').send(userData); // Register user first

    const res = await request.post('/api/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should not log in with incorrect password', async () => {
    const userData = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: 'testpassword123',
    };
    await request.post('/api/auth/register').send(userData);

    const res = await request.post('/api/auth/login').send({
      email: userData.email,
      password: 'wrongpassword',
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('status', 'fail');
    expect(res.body.message).toBe('Incorrect email or password');
  });
});