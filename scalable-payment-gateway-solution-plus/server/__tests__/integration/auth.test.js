```javascript
const { request, testDb, setupTestDB, tearDownTestDB, generateToken } = require('../setup');
const bcrypt = require('bcryptjs');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await tearDownTestDB();
    await testDb.destroy();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer and return a token', async () => {
      const res = await request().post('/api/auth/register').send({
        email: 'newcustomer@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Customer',
        role: 'customer',
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('newcustomer@test.com');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should register a new merchant and return a token', async () => {
      const res = await request().post('/api/auth/register').send({
        email: 'newmerchant@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Merchant',
        role: 'merchant',
        merchantName: 'Test Merchant Inc.',
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('newmerchant@test.com');
      expect(res.body.user.role).toBe('merchant');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.merchant).toHaveProperty('name', 'Test Merchant Inc.');
      expect(res.body.merchant).toHaveProperty('status', 'pending'); // Default status
    });

    it('should return 400 if email already exists', async () => {
      // First registration
      await request().post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'password123',
        firstName: 'Dup',
        lastName: 'User',
        role: 'customer',
      });

      // Second registration with same email
      const res = await request().post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'anotherpassword',
        firstName: 'Another',
        lastName: 'User',
        role: 'customer',
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User with this email already exists.');
    });

    it('should return 400 for invalid input (e.g., missing password)', async () => {
      const res = await request().post('/api/auth/register').send({
        email: 'invalid@test.com',
        firstName: 'Invalid',
        lastName: 'User',
        role: 'customer',
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message'); // Joi validation error
    });
  });

  describe('POST /api/auth/login', () => {
    let customerUser;
    let merchantUser;
    let adminUser;

    beforeAll(async () => {
      // Create users for login tests
      await testDb('users').del(); // Clean up users before inserting specific ones
      const hashedPassword = await bcrypt.hash('loginpassword', 10);
      [customerUser] = await testDb('users').insert({
        email: 'login_customer@test.com',
        password: hashedPassword,
        first_name: 'Login',
        last_name: 'Customer',
        role: 'customer'
      }).returning('*');

      [merchantUser] = await testDb('users').insert({
        email: 'login_merchant@test.com',
        password: hashedPassword,
        first_name: 'Login',
        last_name: 'Merchant',
        role: 'merchant'
      }).returning('*');

      [adminUser] = await testDb('users').insert({
        email: 'login_admin@test.com',
        password: hashedPassword,
        first_name: 'Login',
        last_name: 'Admin',
        role: 'admin'
      }).returning('*');
    });

    it('should log in a customer and return a token', async () => {
      const res = await request().post('/api/auth/login').send({
        email: 'login_customer@test.com',
        password: 'loginpassword',
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login_customer@test.com');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should log in a merchant and return a token', async () => {
      const res = await request().post('/api/auth/login').send({
        email: 'login_merchant@test.com',
        password: 'loginpassword',
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login_merchant@test.com');
      expect(res.body.user.role).toBe('merchant');
    });

    it('should log in an admin and return a token', async () => {
      const res = await request().post('/api/auth/login').send({
        email: 'login_admin@test.com',
        password: 'loginpassword',
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login_admin@test.com');
      expect(res.body.user.role).toBe('admin');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request().post('/api/auth/login').send({
        email: 'login_customer@test.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request().post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should return 400 for invalid input (e.g., missing email)', async () => {
      const res = await request().post('/api/auth/login').send({
        password: 'password123',
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});
```

#### Frontend Tests (Conceptual - React Testing Library)