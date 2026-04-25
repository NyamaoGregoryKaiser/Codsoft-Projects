import { UserService } from '@services/UserService';
import { User } from '@models/User';
import { AppDataSource } from '@db/data-source';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { AppError } from '@utils/app-error';

// Mock TypeORM repository
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as Repository<User>;

// Mock bcrypt functions
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mockSalt')),
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

// Mock AppDataSource.getRepository
jest.mock('@db/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
    isInitialized: true, // Assume initialized for unit tests
    initialize: jest.fn(() => Promise.resolve()),
    dropDatabase: jest.fn(() => Promise.resolve()),
    runMigrations: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve()),
  },
}));

describe('UserService (Unit Tests)', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null); // No existing user
      mockUserRepository.create = jest.fn(user => ({ id: 'new-uuid', ...user }));
      mockUserRepository.save = jest.fn(user => Promise.resolve(user));

      const newUser = await userService.registerUser('testuser', 'test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2); // Check for email and username
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(newUser).toHaveProperty('id', 'new-uuid');
      expect(newUser).toHaveProperty('username', 'testuser');
      expect(newUser).toHaveProperty('email', 'test@example.com');
      expect(newUser).not.toHaveProperty('passwordHash'); // Ensure password hash is not returned
    });

    it('should throw AppError if email already exists', async () => {
      mockUserRepository.findOne = jest.fn((options: any) => {
        if (options.where.email === 'test@example.com') {
          return Promise.resolve({ id: 'existing-id', email: 'test@example.com' });
        }
        return Promise.resolve(null);
      });

      await expect(userService.registerUser('anotheruser', 'test@example.com', 'password123'))
        .rejects.toThrow(new AppError('User with this email already exists', 400));
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw AppError if username already exists', async () => {
      mockUserRepository.findOne = jest.fn((options: any) => {
        if (options.where.username === 'testuser') {
          return Promise.resolve({ id: 'existing-id', username: 'testuser' });
        }
        return Promise.resolve(null);
      });

      await expect(userService.registerUser('testuser', 'another@example.com', 'password123'))
        .rejects.toThrow(new AppError('User with this username already exists', 400));
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    const mockUserWithHash = { id: 'user-id', username: 'testuser', email: 'test@example.com', passwordHash: 'hashedPassword' };

    it('should successfully log in a user', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUserWithHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loggedInUser = await userService.loginUser('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(loggedInUser).toHaveProperty('id', 'user-id');
      expect(loggedInUser).not.toHaveProperty('passwordHash');
    });

    it('should throw AppError for invalid email', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(userService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toThrow(new AppError('Invalid credentials', 401));
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw AppError for invalid password', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUserWithHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(userService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow(new AppError('Invalid credentials', 401));
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });

  describe('getUserById', () => {
    const mockUser = { id: 'user-id', username: 'testuser', email: 'test@example.com', passwordHash: 'hashedPassword' };

    it('should return a user if found', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      const user = await userService.getUserById('user-id');
      expect(user).toEqual(expect.objectContaining({ id: 'user-id', email: 'test@example.com' }));
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne = jest.fn().mockResolvedValue(null);
      const user = await userService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should return true if user is deleted', async () => {
      mockUserRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });
      const result = await userService.deleteUser('user-id');
      expect(result).toBe(true);
      expect(mockUserRepository.delete).toHaveBeenCalledWith('user-id');
    });

    it('should return false if user not found for deletion', async () => {
      mockUserRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });
      const result = await userService.deleteUser('non-existent-id');
      expect(result).toBe(false);
    });
  });
});