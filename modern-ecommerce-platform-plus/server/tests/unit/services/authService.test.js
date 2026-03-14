```javascript
// server/tests/unit/services/authService.test.js
const authService = require('../../../src/services/authService');
const prisma = require('../../../src/config/db');
const bcrypt = require('bcryptjs');
const ApiError = require('../../../src/utils/ApiError');
const { generateToken } = require('../../../src/utils/jwt');

// Mock Prisma client methods
jest.mock('../../../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock JWT
jest.mock('../../../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked-jwt-token'),
}));

describe('Auth Service', () => {
  const mockUser = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'USER',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // --- Register User Tests ---
  describe('registerUser', () => {
    it('should register a new user and return user data and token', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // No existing user
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      prisma.user.create.mockResolvedValue({ ...mockUser, password: 'hashedPassword123' });

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };
      const result = await authService.registerUser(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: 'hashedPassword123',
          role: 'USER',
        },
      });
      expect(generateToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role },
        token: 'mocked-jwt-token',
      });
    });

    it('should throw ApiError if user with email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser); // User already exists

      const userData = {
        name: 'Existing User',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.registerUser(userData)).rejects.toThrow(ApiError);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // --- Login User Tests ---
  describe('loginUser', () => {
    it('should log in a user and return user data and token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Password matches

      const result = await authService.loginUser(mockUser.email, 'correctpassword');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', mockUser.password);
      expect(generateToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role },
        token: 'mocked-jwt-token',
      });
    });

    it('should throw ApiError if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // User not found

      await expect(authService.loginUser('nonexistent@example.com', 'password')).rejects.toThrow(ApiError);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ApiError if password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Password mismatch

      await expect(authService.loginUser(mockUser.email, 'wrongpassword')).rejects.toThrow(ApiError);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
    });
  });

  // --- Get User Profile Tests ---
  describe('getUserProfile', () => {
    it('should return user profile if found', async () => {
      const userProfile = { ...mockUser };
      delete userProfile.password; // Profile should not return password
      prisma.user.findUnique.mockResolvedValue(userProfile);

      const result = await authService.getUserProfile(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual(userProfile);
    });

    it('should throw ApiError if user profile not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserProfile('nonexistentId')).rejects.toThrow(ApiError);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistentId' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
    });
  });

  // --- Update Profile Tests ---
  describe('updateProfile', () => {
    it('should update user profile details', async () => {
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      delete updatedUser.password; // Select removes password from result

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(mockUser.id, updatedData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updatedData,
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash new password if provided in update data', async () => {
      const updatedData = { password: 'newSecurePassword' };
      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      delete updatedUser.password; // Select removes password from result
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(mockUser.id, updatedData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newSecurePassword', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newHashedPassword' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(result.id).toBe(mockUser.id);
      expect(result.name).toBe(mockUser.name); // Other fields unchanged
    });

    it('should throw ApiError if user not found for update', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.updateProfile('nonexistentId', { name: 'New Name' })).rejects.toThrow(ApiError);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should not allow role update via updateProfile', async () => {
      const updatedData = { name: 'Updated Name', role: 'ADMIN' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      delete updatedUser.password;

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(mockUser.id, updatedData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { name: 'Updated Name' }, // Role should be stripped
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(result.role).toBe('USER'); // Role remains unchanged
    });
  });
});
```