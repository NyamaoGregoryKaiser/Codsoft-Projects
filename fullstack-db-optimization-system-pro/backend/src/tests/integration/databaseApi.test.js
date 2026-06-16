```javascript
const request = require('supertest');
const app = require('../../app');
const sequelize = require('../../config/database');
const { User, Database } = require('../../models');
const jwt = require('jsonwebtoken');

// Setup for test database
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'integration_test_secret'; // Use a specific secret for tests
  await sequelize.sync({ force: true }); // Clear and re-create tables for tests
});

afterEach(async () => {
  await Database.destroy({ truncate: true, cascade: true });
  await User.destroy({ truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Database API Integration Tests', () => {
  let adminToken;
  let normalUserToken;
  let adminUser;
  let normalUser;

  beforeEach(async () => {
    adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@test.com',
      password: 'adminpassword', // Will be hashed by model hook
      role: 'admin',
    });
    normalUser = await User.create({
      username: 'normaluser',
      email: 'user@test.com',
      password: 'userpassword',
      role: 'user',
    });

    adminToken = jwt.sign({ userId: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    normalUserToken = jwt.sign({ userId: normalUser.id, role: normalUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  const testDbConfig = {
    name: 'Test DB',
    dbName: 'testdb',
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'testuser',
    password: 'testpassword',
    ssl: false,
  };

  describe('POST /api/databases', () => {
    it('should create a new database connection for an authenticated user', async () => {
      const res = await request(app)
        .post('/api/databases')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send(testDbConfig);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(testDbConfig.name);
      expect(res.body.userId).toBe(normalUser.id);
      expect(res.body.password).toBeNull(); // Password should not be returned directly
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/databases')
        .send(testDbConfig);

      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 for invalid input', async () => {
      const invalidConfig = { ...testDbConfig, name: '' };
      const res = await request(app)
        .post('/api/databases')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send(invalidConfig);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Database name cannot be empty');
    });
  });

  describe('GET /api/databases', () => {
    it('should return all databases for the authenticated user', async () => {
      await Database.create({ ...testDbConfig, userId: normalUser.id, name: 'User DB 1' });
      await Database.create({ ...testDbConfig, userId: normalUser.id, name: 'User DB 2' });
      await Database.create({ ...testDbConfig, userId: adminUser.id, name: 'Admin DB' }); // Admin's DB

      const res = await request(app)
        .get('/api/databases')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('User DB 1');
      expect(res.body[1].name).toBe('User DB 2');
    });
  });

  // ... other integration tests for GET /:id, PUT /:id, DELETE /:id, /:id/test-connection
});
```