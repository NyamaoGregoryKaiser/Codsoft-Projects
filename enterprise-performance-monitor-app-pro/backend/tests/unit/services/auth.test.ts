import { AuthService } from '../../../src/services/auth';
import { AppDataSource } from '../../../src/database/data-source';
import { User } from '../../../src/entities/User';
import { hashPassword, comparePassword } from '../../../src/utils/password';
import { generateToken } from '../../../src/utils/jwt';

// Mock TypeORM repository methods
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
};

// Mock TypeORM AppDataSource
jest.mock('../../../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
  },
}));

// Mock utils functions
jest.mock('../../../src/utils/password', () => ({
  hashPassword: jest.fn((p) => Promise.resolve(`hashed_${p}`)),
  comparePassword: jest.fn((p, h) => Promise.resolve(p === h.replace('hashed_', ''))),
}));
jest.mock('../../../src/utils/jwt', () => ({
  generateToken: jest.fn((id) => `mock_jwt_token_for_${id}`),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // User does not exist
      mockUserRepository.create.mockReturnValue({
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      });
      mockUserRepository.save.mockResolvedValue(mockUserRepository.create());

      const result = await authService.registerUser('testuser', 'test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: 'test@example.com' }, { username: 'testuser' }],
      });
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({
        user: { id: 'user-id-123', username: 'testuser', email: 'test@example.com' },
        token: 'mock_jwt_token_for_user-id-123',
      });
    });

    it('should throw an error if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' }); // User already exists

      await expect(authService.registerUser('testuser', 'test@example.com', 'password123'))
        .rejects.toEqual(expect.objectContaining({
          message: 'User with that email or username already exists',
          statusCode: 409,
        }));
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password123',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed_password123');
      expect(generateToken).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({
        user: { id: 'user-id-123', username: 'testuser', email: 'test@example.com' },
        token: 'mock_jwt_token_for_user-id-123',
      });
    });

    it('should throw an error for invalid credentials (user not found)', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toEqual(expect.objectContaining({
          message: 'Invalid credentials',
          statusCode: 401,
        }));
    });

    it('should throw an error for invalid credentials (incorrect password)', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password123',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toEqual(expect.objectContaining({
          message: 'Invalid credentials',
          statusCode: 401,
        }));
    });
  });
});