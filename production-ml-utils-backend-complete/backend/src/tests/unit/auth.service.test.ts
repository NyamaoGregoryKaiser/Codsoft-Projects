```typescript
import { AuthService } from '../../auth/auth.service';
import { UserRepository } from '../../modules/users/user.repository';
import { AppError } from '../../utils/appError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { User } from '../../modules/users/user.entity';

// Mock the UserRepository
jest.mock('../../modules/users/user.repository');
const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

// Mock bcrypt and jsonwebtoken
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

  beforeEach(() => {
    // Reset mocks before each test
    MockUserRepository.mockClear();
    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.compare as jest.Mock).mockClear();
    (jwt.sign as jest.Mock).mockClear();

    // Initialize AuthService with a fresh mocked repository
    authService = new AuthService();
    userRepository = (authService as any).userRepository; // Access private member for testing
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { id: '1', name: 'Test', email: 'test@example.com', role: 'user' } as User;
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const user = await authService.register('Test User', 'test@example.com', 'password123');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      });
      expect(user).toEqual(mockUser);
    });

    it('should throw AppError if user with email already exists', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register('Test User', 'test@example.com', 'password123')).rejects.toThrow(
        new AppError('User with that email already exists', 409)
      );
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as User; // Cast to unknown first to allow setting password directly

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);

      const user = await authService.login('test@example.com', 'password123');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(user).toEqual(expect.objectContaining({ id: '1', email: 'test@example.com' }));
    });

    it('should throw AppError for incorrect email', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow(
        new AppError('Incorrect email or password', 401)
      );
    });

    it('should throw AppError for incorrect password', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(false),
      } as unknown as User;

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        new AppError('Incorrect email or password', 401)
      );
    });
  });

  describe('createToken', () => {
    it('should create a JWT token', () => {
      const userId = 'user123';
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = authService.createToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      expect(token).toBe(mockToken);
    });
  });
});
```