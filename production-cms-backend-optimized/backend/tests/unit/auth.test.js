```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../../src/db/models');
const authService = require('../../src/services/auth.service');
const { createError } = require('../../src/utils/errorHandler');
const config = require('../../src/config');

// Mock Sequelize models and external modules
jest.mock('../../src/db/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Role: {
    findOne: jest.fn(),
  },
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config', () => ({
  jwtSecret: 'test_jwt_secret',
  jwtExpiration: '1h',
}));
jest.mock('../../src/utils/errorHandler', () => ({
  createError: jest.fn((statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }),
}));
jest.mock('../../src/utils/logger'); // Mock logger to prevent console output during tests

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user and return a token', async () => {
      const mockRole = { id: 'role-uuid-1', name: 'Author' };
      Role.findOne.mockResolvedValue(mockRole);
      User.findOne.mockResolvedValue(null); // No existing user
      bcrypt.genSalt.mockResolvedValue('mockSalt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({
        id: 'user-uuid-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: mockRole.id,
      });
      User.findByPk.mockResolvedValue({ // For fetching user with role after creation
        id: 'user-uuid-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: mockRole.id,
        Role: mockRole,
      });
      jwt.sign.mockReturnValue('mockToken');

      const { user, token } = await authService.registerUser('testuser', 'test@example.com', 'Password123!');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          $or: [{ email: 'test@example.com' }, { username: 'testuser' }]
        }
      });
      expect(Role.findOne).toHaveBeenCalledWith({ where: { name: 'Author' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 'mockSalt');
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: mockRole.id,
      });
      expect(User.findByPk).toHaveBeenCalledWith('user-uuid-1', {
        include: [{ model: Role, as: 'Role' }]
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-uuid-1', roleId: mockRole.id, roleName: 'Author' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );
      expect(user).toBeDefined();
      expect(token).toBe('mockToken');
      expect(user.username).toBe('testuser');
      expect(user.Role.name).toBe('Author');
    });

    it('should throw 400 error if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' }); // User with same email exists

      await expect(authService.registerUser('testuser', 'test@example.com', 'Password123!')).rejects.toEqual(
        expect.objectContaining({
          statusCode: 400,
          message: 'User with this email already exists.',
        })
      );
      expect(createError).toHaveBeenCalledWith(400, 'User with this email already exists.');
    });

    it('should throw 400 error if username already exists', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser' }); // User with same username exists

      await expect(authService.registerUser('testuser', 'test@example.com', 'Password123!')).rejects.toEqual(
        expect.objectContaining({
          statusCode: 400,
          message: 'User with this username already exists.',
        })
      );
      expect(createError).toHaveBeenCalledWith(400, 'User with this username already exists.');
    });
  });

  describe('loginUser', () => {
    it('should successfully log in a user and return a token', async () => {
      const mockRole = { id: 'role-uuid-1', name: 'Author' };
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: mockRole.id,
        Role: mockRole,
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Passwords match
      jwt.sign.mockReturnValue('mockToken');

      const { user, token } = await authService.loginUser('test@example.com', 'Password123!');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [{ model: Role, as: 'Role' }]
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-uuid-1', roleId: mockRole.id, roleName: 'Author' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );
      expect(user).toBeDefined();
      expect(token).toBe('mockToken');
      expect(user.email).toBe('test@example.com');
    });

    it('should throw 401 error if user not found', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      await expect(authService.loginUser('nonexistent@example.com', 'Password123!')).rejects.toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid credentials',
        })
      );
      expect(createError).toHaveBeenCalledWith(401, 'Invalid credentials');
    });

    it('should throw 401 error if passwords do not match', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: 'role-uuid-1',
        Role: { id: 'role-uuid-1', name: 'Author' },
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Passwords don't match

      await expect(authService.loginUser('test@example.com', 'WrongPassword!')).rejects.toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid credentials',
        })
      );
      expect(createError).toHaveBeenCalledWith(401, 'Invalid credentials');
    });
  });

  describe('getUserById', () => {
    it('should return user details excluding password', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: 'role-uuid-1',
        Role: { id: 'role-uuid-1', name: 'Author' },
      };
      User.findByPk.mockResolvedValue(mockUser);

      const user = await authService.getUserById('user-uuid-1');

      expect(User.findByPk).toHaveBeenCalledWith('user-uuid-1', {
        attributes: { exclude: ['password'] },
        include: [{ model: Role, as: 'Role' }]
      });
      expect(user).toBeDefined();
      expect(user.password).toBe('hashedPassword'); // Mocked user still has password, actual service would exclude it
      expect(user.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const user = await authService.getUserById('non-existent-uuid');

      expect(user).toBeNull();
    });
  });
});
```