const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const { signToken } = require('../../utils/jwt');
const redisClient = require('../../utils/redisClient'); // Mocked

// Mocking User model methods
jest.mock('../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue('OK');
    redisClient.del.mockResolvedValue(1);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        correctPassword: jest.fn(() => true),
      };
      User.create.mockResolvedValue(newUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe('testuser');
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it('should return 409 if email or username already registered', async () => {
      User.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existing', email: 'existing@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('Email or username already registered.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const existingUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        correctPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('token');
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(existingUser.correctPassword).toHaveBeenCalledWith('password123', existingUser.password);
    });

    it('should return 401 for incorrect credentials', async () => {
      User.findOne.mockResolvedValue(null); // User not found
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    beforeEach(() => {
      token = signToken('user123'); // Generate a valid token
    });

    it('should return current user data if authenticated', async () => {
      const currentUser = { id: 'user123', username: 'loggeduser', email: 'logged@example.com', role: 'user' };
      User.findByPk.mockResolvedValue(currentUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe('loggeduser');
      expect(User.findByPk).toHaveBeenCalledWith('user123');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me'); // No token
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });
  });
});