```typescript
import AuthService from '../../services/authService';
import prisma from '../../database/prisma';
import { ApiError } from '../../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { UserRole } from '@prisma/client';

// Mock prisma for unit tests (optional, can use actual DB with setup.ts)
jest.mock('../../database/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user1', email: 'test@example.com', role: UserRole.USER, createdAt: new Date()
      });

      const { user } = await AuthService.register({ email: 'test@example.com', password: 'password123' });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.USER);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should throw ApiError if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', email: 'test@example.com' });

      await expect(AuthService.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(ApiError);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login a user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = { id: 'user1', email: 'test@example.com', password: hashedPassword, role: UserRole.USER };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('mockToken');

      const { user, token } = await AuthService.login({ email: 'test@example.com', password: 'password123' });

      expect(user).toHaveProperty('id', 'user1');
      expect(token).toBe('mockToken');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', hashedPassword);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user1', email: 'test@example.com', role: UserRole.USER },
        config.jwt.secret,
        { expiresIn: config.jwt.expirationTime }
      );
    });

    it('should throw ApiError for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login({ email: 'nonexistent@example.com', password: 'password123' }))
        .rejects.toThrow(ApiError);
    });

    it('should throw ApiError for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = { id: 'user1', email: 'test@example.com', password: hashedPassword, role: UserRole.USER };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(AuthService.login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects.toThrow(ApiError);
    });
  });
});

// Mock bcrypt and jwt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword123'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    jwt: {
      secret: 'test_jwt_secret',
      expirationTime: '1h',
    },
    admin: {
      email: 'admin@example.com',
      password: 'adminpassword',
    },
    env: 'test',
    port: 5000,
    databaseUrl: 'testdb'
  },
}));
```