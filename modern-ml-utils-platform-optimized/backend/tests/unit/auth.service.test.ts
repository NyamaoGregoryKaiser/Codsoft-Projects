import * as authService from '../../src/modules/auth/auth.service';
import { User } from '../../src/modules/users/entities/User';
import AppDataSource from '../../src/database/datasource';
import ApiError from '../../src/shared/errors/ApiError';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import config from '../../src/config';

// Mock TypeORM repository
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// Mock bcrypt and jwt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockedJwtToken'),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
  });

  // Mock getRepository only for this test file
  jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepository as any);

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // User does not exist
      mockUserRepository.create.mockReturnValue({
        id: 'user1',
        email: 'test@example.com',
        password: 'hashed_password123',
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const user = await authService.registerUser(userData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: `hashed_${userData.password}`,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
    });

    it('should throw an error if email is already taken', async () => {
      mockUserRepository.findOne.mockResolvedValue(new User()); // User already exists

      const userData = { email: 'existing@example.com', password: 'password123' };
      await expect(authService.registerUser(userData)).rejects.toThrow(
        new ApiError(400, 'Email already taken')
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully', async () => {
      const user = new User();
      user.id = 'user1';
      user.email = 'test@example.com';
      user.password = 'hashed_password123';
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loggedInUser = await authService.loginUser('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password123');
      expect(loggedInUser.email).toBe('test@example.com');
    });

    it('should throw an error for incorrect email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.loginUser('wrong@example.com', 'password123')).rejects.toThrow(
        new ApiError(401, 'Incorrect email or password')
      );
    });

    it('should throw an error for incorrect password', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.password = 'hashed_password123';
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        new ApiError(401, 'Incorrect email or password')
      );
    });
  });

  describe('generateAuthToken', () => {
    it('should generate a JWT token', () => {
      const token = authService.generateAuthToken('userId123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'userId123' },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      expect(token).toBe('mockedJwtToken');
    });
  });
});