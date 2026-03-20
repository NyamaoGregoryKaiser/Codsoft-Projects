const request = require('supertest');
const app = require('@src/app');
const prisma = require('@config/db').default;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Routes (Integration)', () => {
  let testUser;
  const mockPassword = 'password123';

  beforeAll(async () => {
    // Clear test database before all tests
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test to ensure isolation
    await prisma.user.deleteMany();
  });

  it('POST /api/auth/register should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'integrationtestuser', password: mockPassword });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.username).toBe('integrationtestuser');
    expect(res.body.data).toHaveProperty('token');

    testUser = await prisma.user.findUnique({ where: { username: 'integrationtestuser' } });
    expect(testUser).not.toBeNull();
    expect(await bcrypt.compare(mockPassword, testUser.password)).toBe(true);
  });

  it('POST /api/auth/register should return 400 if username already exists', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'duplicateuser', password: mockPassword });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'duplicateuser', password: mockPassword });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User already exists');
  });

  it('POST /api/auth/login should log in an existing user', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'loginuser', password: mockPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: mockPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.username).toBe('loginuser');
    expect(res.body.data).toHaveProperty('token');
  });

  it('POST /api/auth/login should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('GET /api/auth/me should return current user profile', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'currentuser', password: mockPassword });

    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('currentuser');
  });

  it('GET /api/auth/me should return 401 if no token is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  it('GET /api/auth/me should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer invalidtoken`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authorized, token failed');
  });
});
```

#### `backend/tests/integration/routes/query.integration.test.js`
```javascript