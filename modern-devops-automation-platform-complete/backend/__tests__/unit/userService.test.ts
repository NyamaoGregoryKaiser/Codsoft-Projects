```typescript
import { UserService } from '../../src/services/UserService';
import { User } from '../../src/entities/User';
import AppDataSource from '../../src/data-source';
import * as bcrypt from 'bcryptjs';
import { NotFoundError, UnauthorizedError } from '../../src/utils/errorHandler';

// Mock TypeORM repository methods
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
};

// Mock TypeORM AppDataSource
jest.mock('../../src/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
  },
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser = { ...userData, password: hashedPassword, id: 'some-uuid' };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockUserRepository.findOneBy.mockResolvedValue(null); // User does not exist
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await userService.registerUser(userData);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(expect.objectContaining({ email: userData.email, username: userData.username }));
      expect(result).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should throw an error if user with email already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockUserRepository.findOneBy.mockResolvedValue(true); // User already exists

      await expect(userService.registerUser(userData)).rejects.toThrow('User with this email already exists');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully and return user data', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword';
      const user = { id: 'some-uuid', username: 'testuser', email: loginData.email, password: hashedPassword };

      mockUserRepository.findOneBy.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await userService.loginUser(loginData.email, loginData.password);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, hashedPassword);
      expect(result).toEqual(expect.objectContaining({ email: loginData.email, username: user.username }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError for invalid credentials (user not found)', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(userService.loginUser(loginData.email, loginData.password)).rejects.toThrow(UnauthorizedError);
      await expect(userService.loginUser(loginData.email, loginData.password)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid credentials (wrong password)', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const hashedPassword = 'hashedPassword';
      const user = { id: 'some-uuid', username: 'testuser', email: loginData.email, password: hashedPassword };

      mockUserRepository.findOneBy.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(userService.loginUser(loginData.email, loginData.password)).rejects.toThrow(UnauthorizedError);
      await expect(userService.loginUser(loginData.email, loginData.password)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, hashedPassword);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const userId = 'some-uuid';
      const user = { id: userId, username: 'testuser', email: 'test@example.com' };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserById(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['projects', 'tasks'],
        select: ['id', 'username', 'email'], // Ensure password is not selected
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundError if user not found', async () => {
      const userId = 'nonexistent-uuid';
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserById(userId)).rejects.toThrow(`User with ID ${userId} not found`);
    });
  });
});
```