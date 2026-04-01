import { AuthService } from '../../services/auth.service';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../models/User.entity';
import * as passwordUtils from '../../utils/password';
import * as jwtUtils from '../../utils/jwt';
import { HttpException } from '../../utils/http-exception';

// Mock TypeORM Repository
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  })),
};

// Mock AppDataSource to return our mock repository
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
    initialize: jest.fn(),
    destroy: jest.fn(),
    runMigrations: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService();
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const hashedPassword = 'hashedPassword123';
      const newUser = {
        id: 'user-id-1',
        ...userData,
        password: hashedPassword,
        role: UserRole.USER,
      };

      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue(hashedPassword);
      jest.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue('mockAccessToken');
      jest.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue('mockRefreshToken');

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await authService.register(userData);

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...userData,
        password: hashedPassword,
        role: UserRole.USER,
      }));
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({ id: newUser.id, email: newUser.email, role: newUser.role });
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith({ id: newUser.id, email: newUser.email, role: newUser.role });
      expect(result).toEqual({
        user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role },
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
    });

    it('should throw HttpException if email is already registered', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' }); // Existing user found

      await expect(authService.register(userData)).rejects.toThrow(HttpException);
      await expect(authService.register(userData)).rejects.toHaveProperty('status', 409);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw 500 HttpException on generic database error during registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(() => { throw new Error('DB error'); });

      await expect(authService.register(userData)).rejects.toThrow(HttpException);
      await expect(authService.register(userData)).rejects.toHaveProperty('status', 500);
    });
  });

  describe('login', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = 'hashedPassword123';
      const user = {
        id: 'user-id-1',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockUserRepository.createQueryBuilder().getOne.mockResolvedValue(user);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue('mockAccessToken');
      jest.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue('mockRefreshToken');

      const result = await authService.login(loginData);

      expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalled();
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(loginData.password, hashedPassword);
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({ id: user.id, email: user.email, role: user.role });
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith({ id: user.id, email: user.email, role: user.role });
      expect(result).toEqual({
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
    });

    it('should throw HttpException for invalid credentials (user not found)', async () => {
      const loginData = { email: 'nonexistent@example.com', password: 'password123' };
      mockUserRepository.createQueryBuilder().getOne.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(HttpException);
      await expect(authService.login(loginData)).rejects.toHaveProperty('status', 401);
      expect(passwordUtils.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw HttpException for invalid credentials (incorrect password)', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      const hashedPassword = 'hashedPassword123';
      const user = {
        id: 'user-id-1',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockUserRepository.createQueryBuilder().getOne.mockResolvedValue(user);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(HttpException);
      await expect(authService.login(loginData)).rejects.toHaveProperty('status', 401);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(loginData.password, hashedPassword);
    });

    it('should throw 500 HttpException on generic database error during login', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      mockUserRepository.createQueryBuilder().getOne.mockRejectedValue(new Error('DB error'));

      await expect(authService.login(loginData)).rejects.toThrow(HttpException);
      await expect(authService.login(loginData)).rejects.toHaveProperty('status', 500);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh an access token', async () => {
      const oldRefreshToken = 'oldRefreshToken';
      const decodedPayload = { id: 'user-id-1', email: 'test@example.com', role: UserRole.USER };
      const user = {
        id: 'user-id-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };
      const newAccessToken = 'newAccessToken';

      jest.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(oldRefreshToken);

      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: decodedPayload.id } });
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith({ id: user.id, email: user.email, role: user.role });
      expect(result).toEqual({ accessToken: newAccessToken });
    });

    it('should throw HttpException if refresh token is invalid', async () => {
      const invalidRefreshToken = 'invalidRefreshToken';
      jest.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(null);

      await expect(authService.refreshToken(invalidRefreshToken)).rejects.toThrow(HttpException);
      await expect(authService.refreshToken(invalidRefreshToken)).rejects.toHaveProperty('status', 403);
    });

    it('should throw HttpException if user not found for refresh token', async () => {
      const oldRefreshToken = 'oldRefreshToken';
      const decodedPayload = { id: 'nonexistent-id', email: 'nonexistent@example.com', role: UserRole.USER };

      jest.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.refreshToken(oldRefreshToken)).rejects.toThrow(HttpException);
      await expect(authService.refreshToken(oldRefreshToken)).rejects.toHaveProperty('status', 401);
    });

    it('should throw 500 HttpException on generic error during refresh token', async () => {
      const oldRefreshToken = 'oldRefreshToken';
      const decodedPayload = { id: 'user-id-1', email: 'test@example.com', role: UserRole.USER };

      jest.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(authService.refreshToken(oldRefreshToken)).rejects.toThrow(HttpException);
      await expect(authService.refreshToken(oldRefreshToken)).rejects.toHaveProperty('status', 500);
    });
  });
});