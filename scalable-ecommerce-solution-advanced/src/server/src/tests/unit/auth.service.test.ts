import { AppDataSource } from '../../database';
import { User, UserRole } from '../../database/entities/User.entity';
import { Cart } from '../../database/entities/Cart.entity';
import { AuthService } from '../../services/auth.service';
import ApiError from '../../utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import * as jwtUtils from '../../utils/jwt.utils';

// Mock TypeORM repositories
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockCartRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

// Mock AppDataSource to return our mock repositories
jest.mock('../../database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === Cart) return mockCartRepository;
      return {};
    }),
  },
}));

// Mock bcrypt and jwtUtils
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../utils/jwt.utils', () => ({
  generateAuthTokens: jest.fn(),
  verifyToken: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('register', () => {
    const userData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
    };

    it('should successfully register a new user and create a cart', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // User does not exist
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockUser = {
        id: 'user-id-123',
        ...userData,
        password: 'hashedPassword',
        role: UserRole.USER,
      };
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const mockCart = { id: 'cart-id-123', user: mockUser, items: [] };
      mockCartRepository.create.mockReturnValue(mockCart);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const result = await authService.register(userData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          password: 'hashedPassword',
          role: UserRole.USER,
        })
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockCartRepository.create).toHaveBeenCalledWith({ user: mockUser });
      expect(mockCartRepository.save).toHaveBeenCalledWith(mockCart);

      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        })
      );
    });

    it('should throw ApiError if email already registered', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: userData.email }); // User exists

      await expect(authService.register(userData)).rejects.toThrow(
        new ApiError(StatusCodes.CONFLICT, 'Email already registered')
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).not.toHaveBeenCalled(); // Should not proceed to hash password
    });
  });

  describe('login', () => {
    const email = 'login@example.com';
    const password = 'CorrectPassword123';
    const wrongPassword = 'WrongPassword';

    let mockUser: User;
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    beforeEach(() => {
      mockUser = {
        id: 'user-id-456',
        firstName: 'Login',
        lastName: 'User',
        email,
        password: 'hashedPassword', // Stored hashed password
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {} as Cart,
        orders: []
      };
      (jwtUtils.generateAuthTokens as jest.Mock).mockReturnValue(mockTokens);
    });

    it('should successfully login and return user and tokens', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Password matches

      const result = await authService.login(email, password);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtUtils.generateAuthTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ user: { id: mockUser.id, email: mockUser.email, role: mockUser.role }, tokens: mockTokens });
    });

    it('should throw ApiError for incorrect password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password does not match

      await expect(authService.login(email, wrongPassword)).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password')
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, mockUser.password);
      expect(jwtUtils.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw ApiError for unregistered email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // User not found

      await expect(authService.login(email, password)).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password')
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Should not attempt to compare password
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'validRefreshToken';
    const invalidRefreshToken = 'invalidRefreshToken';
    const userId = 'user-id-789';

    let mockUser: User;
    const newMockTokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };

    beforeEach(() => {
      mockUser = {
        id: userId,
        firstName: 'Refresh',
        lastName: 'User',
        email: 'refresh@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {} as Cart,
        orders: []
      };
      (jwtUtils.generateAuthTokens as jest.Mock).mockReturnValue(newMockTokens);
    });

    it('should successfully refresh tokens', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId, role: UserRole.USER });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.refreshTokens(refreshToken);

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(jwtUtils.generateAuthTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ user: { id: mockUser.id, email: mockUser.email, role: mockUser.role }, tokens: newMockTokens });
    });

    it('should throw ApiError for invalid refresh token', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(null); // Invalid token

      await expect(authService.refreshTokens(invalidRefreshToken)).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token')
      );
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw ApiError if user not found for refresh token', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId, role: UserRole.USER });
      mockUserRepository.findOne.mockResolvedValue(null); // User not found

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'User not found for refresh token')
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(jwtUtils.generateAuthTokens).not.toHaveBeenCalled();
    });
  });
});