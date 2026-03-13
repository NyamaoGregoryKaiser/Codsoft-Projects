```typescript
import { AppDataSource } from '../../../src/database/data-source';
import { User } from '../../../src/database/entities/User';
import { CustomError } from '../../../src/utils/errors';
import * as authService from '../../../src/services/auth.service';
import * as jwtUtil from '../../../src/utils/jwt';
import { Repository } from 'typeorm';
import { UserRole } from '../../../src/types/enums';

// Mock TypeORM repository
const mockUserRepository: Partial<Repository<User>> = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// Mock AppDataSource to return the mocked repository
jest.mock('../../../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
  },
}));

// Mock jwt utility functions
jest.mock('../../../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mockedJwtToken'),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'Password123!';
      const role = UserRole.USER;

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null); // No existing email
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null); // No existing username
      (mockUserRepository.create as jest.Mock).mockReturnValue({
        id: 'user-id-1',
        username,
        email,
        password: 'hashedpassword',
        role,
      });
      (mockUserRepository.save as jest.Mock).mockResolvedValue({
        id: 'user-id-1',
        username,
        email,
        password: 'hashedpassword',
        role,
      });

      const newUser = await authService.registerUser(username, email, password, role);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(mockUserRepository.create).toHaveBeenCalledWith({ username, email, password, role });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(newUser).toEqual({ id: 'user-id-1', username, email, role });
    });

    it('should throw CustomError if email already registered', async () => {
      const existingUser = { id: 'existing-id', email: 'test@example.com' };
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        authService.registerUser('newuser', 'test@example.com', 'Password123!', UserRole.USER)
      ).rejects.toThrow(new CustomError('Email already registered', 400));
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CustomError if username already taken', async () => {
        (mockUserRepository.findOneBy as jest.Mock)
          .mockResolvedValueOnce(null) // no existing email
          .mockResolvedValueOnce({ id: 'existing-id', username: 'testuser' }); // existing username

        await expect(
          authService.registerUser('testuser', 'new@example.com', 'Password123!', UserRole.USER)
        ).rejects.toThrow(new CustomError('Username already taken', 400));
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'new@example.com' });
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
        expect(mockUserRepository.create).not.toHaveBeenCalled();
        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });
  });

  describe('loginUser', () => {
    it('should successfully log in a user and return a token', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';
      const mockUser = {
        id: 'user-id-1',
        username: 'testuser',
        email,
        password: 'hashedpassword',
        role: UserRole.USER,
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as User;

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtil.generateToken as jest.Mock).mockReturnValue('mockedJwtToken');

      const { user, token } = await authService.loginUser(email, password);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(jwtUtil.generateToken).toHaveBeenCalledWith(mockUser.id, mockUser.email, mockUser.role);
      expect(token).toBe('mockedJwtToken');
      expect(user).toEqual({
        id: 'user-id-1',
        username: 'testuser',
        email,
        role: UserRole.USER,
      });
    });

    it('should throw CustomError for invalid credentials (user not found)', async () => {
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.loginUser('nonexistent@example.com', 'password')
      ).rejects.toThrow(new CustomError('Invalid credentials', 401));
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(jwtUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw CustomError for invalid credentials (incorrect password)', async () => {
      const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER,
        comparePassword: jest.fn().mockResolvedValue(false), // Incorrect password
      } as unknown as User;

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        new CustomError('Invalid credentials', 401)
      );
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(jwtUtil.generateToken).not.toHaveBeenCalled();
    });
  });
});
```