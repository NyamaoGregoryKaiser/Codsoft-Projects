import { AuthService } from '../../modules/auth/auth.service';
import { AppDataSource } from '../../database';
import { User, UserRole } from '../../database/entities/User';
import * as passwordUtils from '../../shared/utils/password';
import * as jwtUtils from '../../shared/utils/jwt';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import { RegisterUserDto } from '../../modules/auth/dtos/RegisterUser.dto';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let userRepositoryMock: any;
  let hashPasswordSpy: jest.SpyInstance;
  let comparePasswordSpy: jest.SpyInstance;
  let generateTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    userRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      })),
    };

    // Mock AppDataSource to return our mock repository
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(userRepositoryMock);

    authService = new AuthService();

    // Spy on utility functions
    hashPasswordSpy = jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('hashedPassword');
    comparePasswordSpy = jest.spyOn(passwordUtils, 'comparePassword');
    generateTokenSpy = jest.spyOn(jwtUtils, 'generateToken').mockReturnValue('mockToken');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerData: RegisterUserDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      userRepositoryMock.findOne.mockResolvedValue(null);
      userRepositoryMock.create.mockReturnValue({
        id: 'user-id',
        ...registerData,
        password: 'hashedPassword',
        role: UserRole.USER,
      });
      userRepositoryMock.save.mockResolvedValue({
        id: 'user-id',
        ...registerData,
        password: 'hashedPassword',
        role: UserRole.USER,
      });

      const result = await authService.register(registerData);

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { email: registerData.email } });
      expect(hashPasswordSpy).toHaveBeenCalledWith(registerData.password);
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        ...registerData,
        password: 'hashedPassword',
      });
      expect(userRepositoryMock.save).toHaveBeenCalled();
      expect(generateTokenSpy).toHaveBeenCalledWith('user-id', UserRole.USER);
      expect(result).toEqual({
        user: {
          id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: UserRole.USER,
        },
        token: 'mockToken',
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictError if user with email already exists', async () => {
      const registerData: RegisterUserDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123',
      };

      userRepositoryMock.findOne.mockResolvedValue({ id: 'existing-id', email: 'existing@example.com' });

      await expect(authService.register(registerData)).rejects.toThrow(ConflictError);
      await expect(authService.register(registerData)).rejects.toHaveProperty('message', 'User with this email already exists');
      expect(hashPasswordSpy).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(userRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword';
    const mockUser = {
      id: 'user-id',
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
    };

    it('should successfully log in a user with valid credentials', async () => {
      userRepositoryMock.createQueryBuilder().getOne.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(true);

      const result = await authService.login(email, password);

      expect(userRepositoryMock.createQueryBuilder().getOne).toHaveBeenCalled();
      expect(comparePasswordSpy).toHaveBeenCalledWith(password, hashedPassword);
      expect(generateTokenSpy).toHaveBeenCalledWith('user-id', UserRole.USER);
      expect(result).toEqual({
        user: {
          id: 'user-id',
          email,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.USER,
        },
        token: 'mockToken',
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      userRepositoryMock.createQueryBuilder().getOne.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', password)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login('nonexistent@example.com', password)).rejects.toHaveProperty('message', 'Invalid credentials');
      expect(comparePasswordSpy).not.toHaveBeenCalled();
      expect(generateTokenSpy).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      userRepositoryMock.createQueryBuilder().getOne.mockResolvedValue(mockUser);
      comparePasswordSpy.mockResolvedValue(false);

      await expect(authService.login(email, 'wrongpassword')).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(email, 'wrongpassword')).rejects.toHaveProperty('message', 'Invalid credentials');
      expect(comparePasswordSpy).toHaveBeenCalledWith('wrongpassword', hashedPassword);
      expect(generateTokenSpy).not.toHaveBeenCalled();
    });
  });
});