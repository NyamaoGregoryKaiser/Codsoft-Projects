```typescript
import 'reflect-metadata';
import { AppDataSource } from '../../src/database/data-source';
import { User, UserRole } from '../../src/database/entities/user.entity';
import * as authService from '../../src/modules/auth/auth.service';
import { CreateUserDto, LoginUserDto } from '../../src/modules/auth/auth.dto';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../src/utils/errors';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/config';

// Mock TypeORM Repository
const mockUserRepository = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

// Mock User entity methods
User.prototype.hashPassword = jest.fn();
User.prototype.comparePassword = jest.fn();

describe('Auth Service', () => {
  beforeAll(() => {
    // Mock AppDataSource.getRepository to return our mockUserRepository
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepository as any);
    // Mock jwt.sign
    jest.spyOn(jwt, 'sign').mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null); // No existing user
      mockUserRepository.save.mockImplementation((user: User) => Promise.resolve({ ...user, id: 'some-uuid' }));
      (User.prototype.hashPassword as jest.Mock).mockResolvedValue(undefined);

      const newUser = await authService.registerUser(createUserDto);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(User.prototype.hashPassword).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        role: UserRole.MEMBER,
      }));
      expect(newUser).toHaveProperty('id');
      expect(newUser.email).toBe(createUserDto.email);
    });

    it('should throw ConflictError if user with email already exists', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUserRepository.findOneBy.mockResolvedValue({ id: 'existing-id', email: createUserDto.email });

      await expect(authService.registerUser(createUserDto)).rejects.toThrow(ConflictError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError on database save failure', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('DB error'));
      (User.prototype.hashPassword as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.registerUser(createUserDto)).rejects.toThrow(BadRequestError);
    });
  });

  describe('loginUser', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: 'user-id',
        email: loginUserDto.email,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.MEMBER,
        comparePassword: (User.prototype.comparePassword as jest.Mock).mockResolvedValue(true),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const loggedInUser = await authService.loginUser(loginUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginUserDto.email },
        select: expect.arrayContaining(['password']),
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginUserDto.password);
      expect(loggedInUser).toEqual(mockUser);
    });

    it('should throw BadRequestError if email or password are missing', async () => {
      await expect(authService.loginUser({ email: '', password: 'password123' } as LoginUserDto)).rejects.toThrow(BadRequestError);
      await expect(authService.loginUser({ email: 'test@example.com', password: '' } as LoginUserDto)).rejects.toThrow(BadRequestError);
    });

    it('should throw UnauthorizedError for incorrect email', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.loginUser(loginUserDto)).rejects.toThrow(UnauthorizedError);
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(User.prototype.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const mockUser = {
        id: 'user-id',
        email: loginUserDto.email,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.MEMBER,
        comparePassword: (User.prototype.comparePassword as jest.Mock).mockResolvedValue(false),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(authService.loginUser(loginUserDto)).rejects.toThrow(UnauthorizedError);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginUserDto.password);
    });
  });

  describe('signToken', () => {
    it('should sign a JWT token', () => {
      const userId = 'user-id-123';
      const token = authService.signToken(userId);
      expect(jwt.sign).toHaveBeenCalledWith({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });
      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('getJwtCookieExpiration', () => {
    it('should return the JWT cookie expiration from config', () => {
      expect(authService.getJwtCookieExpiration()).toBe(config.jwt.cookieExpiresIn);
    });
  });
});
```