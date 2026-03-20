import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service'; // Needed to mock creation
import { User, UserRole } from '../../src/entities/User';
import { RefreshToken } from '../../src/entities/RefreshToken';
import { getDbDataSource } from '../../src/config/database';
import { Repository } from 'typeorm';
import * as jwtUtils from '../../src/utils/jwt.utils';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../src/types/errors';

// Mock TypeORM Repository
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
} as unknown as Repository<User>;

const mockRefreshTokenRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
} as unknown as Repository<RefreshToken>;

// Mock database connection
jest.mock('../../src/config/database', () => ({
  getDbDataSource: jest.fn(() => ({
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === RefreshToken) return mockRefreshTokenRepository;
      return null;
    }),
  })),
}));

// Mock JWT utilities
jest.mock('../../src/utils/jwt.utils', () => ({
  generateAccessToken: jest.fn(() => 'mockAccessToken'),
  generateRefreshToken: jest.fn(() => 'mockRefreshToken'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  getRefreshTokenExpirationDate: jest.fn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService; // For initial user creation logic

  beforeEach(() => {
    authService = new AuthService();
    userService = new UserService(); // Not directly used in authService tests, but useful for mocks
    jest.clearAllMocks(); // Clear mocks before each test
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn(),
    hashPassword: jest.fn(() => Promise.resolve('newhashedpassword')),
  };

  const mockRefreshToken = {
    id: 'rt-123',
    token: 'mockRefreshToken',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    createdAt: new Date(),
    userId: mockUser.id,
    user: mockUser,
  };

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null); // User not found
      mockUserRepository.create = jest.fn().mockReturnValue(mockUser);
      mockUserRepository.save = jest.fn().mockResolvedValue(mockUser);
      mockUser.hashPassword = jest.fn().mockResolvedValue('newhashedpassword');
      mockRefreshTokenRepository.create = jest.fn().mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save = jest.fn().mockResolvedValue(mockRefreshToken);

      const result = await authService.register('new@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUser.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mockAccessToken');
      expect(result).toHaveProperty('refreshToken', 'mockRefreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw BadRequestError if user with email already exists', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser); // User found

      await expect(authService.register('test@example.com', 'password123')).rejects.toThrow(BadRequestError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in a user and return tokens', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockUser.comparePassword = jest.fn().mockResolvedValue(true); // Password matches
      mockRefreshTokenRepository.create = jest.fn().mockReturnValue(mockRefreshToken);
      mockRefreshTokenRepository.save = jest.fn().mockResolvedValue(mockRefreshToken);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: ['id', 'email', 'password', 'role', 'isEmailVerified'],
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwtUtils.generateAccessToken).toHaveBeenCalled();
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mockAccessToken');
      expect(result).toHaveProperty('refreshToken', 'mockRefreshToken');
    });

    it('should throw UnauthorizedError for invalid credentials (user not found)', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null); // User not found

      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(UnauthorizedError);
      expect(mockUser.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid credentials (password mismatch)', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockUser.comparePassword = jest.fn().mockResolvedValue(false); // Password mismatch

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshTokens', () => {
    const decodedPayload = { id: mockUser.id, email: mockUser.email, role: mockUser.role };

    it('should refresh tokens successfully', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue({ ...mockRefreshToken, user: mockUser });
      mockRefreshTokenRepository.save = jest.fn().mockResolvedValue({ ...mockRefreshToken, isRevoked: true });
      mockRefreshTokenRepository.create = jest.fn().mockReturnValue({ ...mockRefreshToken, token: 'newMockRefreshToken' });

      const result = await authService.refreshTokens('oldRefreshToken');

      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith('oldRefreshToken');
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'oldRefreshToken', userId: decodedPayload.id },
        relations: ['user'],
      });
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true })); // Old token revoked
      expect(jwtUtils.generateAccessToken).toHaveBeenCalled();
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: false })); // New token saved
      expect(result).toHaveProperty('accessToken', 'mockAccessToken');
      expect(result).toHaveProperty('refreshToken', 'mockRefreshToken');
    });

    it('should throw UnauthorizedError if refresh token is invalid', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      await expect(authService.refreshTokens('invalidToken')).rejects.toThrow(UnauthorizedError);
      expect(mockRefreshTokenRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if refresh token is not found in DB', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue(null); // Not found

      await expect(authService.refreshTokens('nonExistentToken')).rejects.toThrow(UnauthorizedError);
      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if refresh token is revoked', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue({ ...mockRefreshToken, isRevoked: true, user: mockUser }); // Revoked

      await expect(authService.refreshTokens('revokedToken')).rejects.toThrow(UnauthorizedError);
      expect(authService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id); // Check if all tokens were revoked
    });

    it('should throw UnauthorizedError if refresh token is expired', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue({ ...mockRefreshToken, expiresAt: new Date(Date.now() - 1000), user: mockUser }); // Expired

      await expect(authService.refreshTokens('expiredToken')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    const decodedPayload = { id: mockUser.id, email: mockUser.email, role: mockUser.role };

    it('should revoke a refresh token', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue(mockRefreshToken);
      mockRefreshTokenRepository.save = jest.fn().mockResolvedValue({ ...mockRefreshToken, isRevoked: true });

      const result = await authService.logout('someRefreshToken');

      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith('someRefreshToken');
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'someRefreshToken', userId: decodedPayload.id },
      });
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true }));
      expect(result).toBe(true);
    });

    it('should return false if refresh token not found', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedPayload);
      mockRefreshTokenRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await authService.logout('nonExistentToken');

      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw UnauthorizedError if refresh token is invalid', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      await expect(authService.logout('invalidToken')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('forgotPassword', () => {
    it('should indicate success if user email exists (for security reasons)', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.forgotPassword('test@example.com');
      expect(result).toBe(true);
      // In a real scenario, this would trigger an email send
    });

    it('should throw NotFoundError if user email does not exist', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null); // User not found

      await expect(authService.forgotPassword('nonexistent@example.com')).rejects.toThrow(NotFoundError);
    });
  });

  describe('resetPassword', () => {
    const validToken = `dummy_reset_token_for_${mockUser.id}_${Date.now()}`;
    it('should reset password successfully', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.save = jest.fn().mockResolvedValue(mockUser);
      mockUser.hashPassword = jest.fn().mockResolvedValue('newhashedpassword');

      const result = await authService.resetPassword(validToken, 'newPassword123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockUser.hashPassword).toHaveBeenCalledWith('newPassword123');
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError for invalid token format', async () => {
      await expect(authService.resetPassword('invalid_token', 'newPassword123')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if user associated with token not found', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null); // User not found

      await expect(authService.resetPassword(validToken, 'newPassword123')).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError if token is expired', async () => {
      const expiredToken = `dummy_reset_token_for_${mockUser.id}_${Date.now() - (2 * 60 * 60 * 1000)}`; // 2 hours ago
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(authService.resetPassword(expiredToken, 'newPassword123')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('revokeAllUserRefreshTokens', () => {
    it('should revoke all refresh tokens for a user', async () => {
      mockRefreshTokenRepository.update = jest.fn().mockResolvedValue({ affected: 2 }); // Assume 2 tokens revoked

      await authService.revokeAllUserRefreshTokens(mockUser.id);

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith({ userId: mockUser.id }, { isRevoked: true });
    });
  });
});