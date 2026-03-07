```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const setupTestDB = require('../utils/setupTestDB');

setupTestDB();

describe('Auth routes', () => {
  let newUser;
  let adminUser;

  beforeEach(async () => {
    // Clear and re-seed before each test (optional, depends on isolation needs)
    await sequelize.sync({ force: true });
    
    newUser = {
      id: uuidv4(),
      name: 'test user',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    };
    adminUser = {
      id: uuidv4(),
      name: 'admin user',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
    };
    await User.bulkCreate([newUser, adminUser]);
  });

  describe('POST /api/auth/register', () => {
    test('should return 201 and successfully register user if data is ok', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'new user',
          email: 'newuser@example.com',
          password: 'newpassword123',
        })
        .expect(httpStatus.CREATED);

      expect(res.body.user).toBeDefined();
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.email).toEqual('newuser@example.com');
      expect(res.body.user.role).toEqual('user');
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.access.token).toBeDefined();
      expect(res.body.tokens.refresh.token).toBeDefined();

      const dbUser = await User.findByPk(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toEqual('newuser@example.com');
      expect(await dbUser.isPasswordMatch('newpassword123')).toBe(true);
    });

    test('should return 400 if email is already taken', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'existing user',
          email: newUser.email, // Use existing email
          password: 'newpassword123',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not meet criteria', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'invalid user',
          email: 'invalid@example.com',
          password: 'short', // Too short
        })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'invalid user 2',
          email: 'invalid2@example.com',
          password: 'onlyletters', // No number
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return 200 and auth tokens if login data is correct', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(httpStatus.OK);

      expect(res.body.user).toBeDefined();
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.email).toEqual(newUser.email);
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.access.token).toBeDefined();
      expect(res.body.tokens.refresh.token).toBeDefined();
    });

    test('should return 401 if email is unknown', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'password123',
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if password is wrong', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: 'wrongpassword',
        })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
```