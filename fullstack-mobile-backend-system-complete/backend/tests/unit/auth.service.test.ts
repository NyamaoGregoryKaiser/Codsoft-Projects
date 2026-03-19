import * as authService from '../../src/modules/auth/auth.service';
import prisma from '../../src/config/prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../src/middleware/errorHandler';
import { JWT_SECRET } from '../../src/config/config';

// Mock Prisma client methods
jest.mock('../../src/config/prismaClient', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Auth Service Unit Tests', () => {
  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const userData = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const result = await authService.registerUser(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, expect.any(Number));
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: 'hashedpassword',
          name: userData.name,
          role: 'USER',
        },
        select: { id: true, email: true, name: true, role: true },
      });
      expect(result).toEqual({ id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role });
    });

    it('should throw ApiError if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const userData = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      await expect(authService.registerUser(userData)).rejects.toThrow(ApiError);
      await expect(authService.registerUser(userData)).rejects.toHaveProperty('statusCode', 409);
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully and return a token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const loginData = { email: 'test@example.com', password: 'password123' };
      const result = await authService.loginUser(loginData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        JWT_SECRET,
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        token: 'mocktoken',
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role },
      });
    });

    it('should throw ApiError for invalid credentials (user not found)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const loginData = { email: 'nonexistent@example.com', password: 'password123' };
      await expect(authService.loginUser(loginData)).rejects.toThrow(ApiError);
      await expect(authService.loginUser(loginData)).rejects.toHaveProperty('statusCode', 401);
    });

    it('should throw ApiError for invalid credentials (incorrect password)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      await expect(authService.loginUser(loginData)).rejects.toThrow(ApiError);
      await expect(authService.loginUser(loginData)).rejects.toHaveProperty('statusCode', 401);
    });
  });
});