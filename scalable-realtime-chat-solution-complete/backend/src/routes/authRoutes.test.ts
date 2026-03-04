```typescript
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import * as authService from '../services/authService';
import { generateToken } from '../utils/jwt';
import { comparePasswords, hashPassword } from '../utils/password';
import { io } from '../server'; // Mocked Socket.IO instance

// Mocking external dependencies
jest.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(), // Mock $executeRaw for test-setup.ts
  },
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(),
  comparePasswords: jest.fn(),
}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(), // Also need to mock verifyToken for protect middleware
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockHashPassword = hashPassword as jest.Mock;
const mockComparePasswords = comparePasswords as jest.Mock;
const mockGenerateToken = generateToken as jest.Mock;
const mockVerifyToken = generateToken as jest.Mock; // Renaming to avoid conflict

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return success message', async () => {
      mockHashPassword.mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 'newUserId',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({
        message: 'User registered successfully',
        user: {
          id: 'newUserId',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          // password missing
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Please enter all fields.');
    });

    it('should return 400 if username or email already exists', async () => {
      const error = new Error('Unique constraint violation');
      (error as any).code = 'P2002'; // Prisma unique constraint error code
      mockPrisma.user.create.mockRejectedValue(error);
      mockHashPassword.mockResolvedValue('hashedPassword');


      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Username or email already exists.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user and return a token', async () => {
      const mockUser = {
        id: 'userId1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue('mockedToken');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        message: 'Logged in successfully',
        user: {
          id: 'userId1',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'mockedToken',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockComparePasswords).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockGenerateToken).toHaveBeenCalledWith('userId1', 'testuser');
    });

    it('should return 400 for invalid credentials (user not found)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Invalid credentials.');
    });

    it('should return 400 for invalid credentials (wrong password)', async () => {
      const mockUser = {
        id: 'userId1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Invalid credentials.');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // password missing
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Please enter all fields.');
    });
  });
});
```