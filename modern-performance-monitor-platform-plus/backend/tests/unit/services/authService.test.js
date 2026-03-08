```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const config = require('../../../src/config');
const { ApiError } = require('../../../src/utils/errorHandler');
const { authService } = require('../../../src/services');
const { userRepository } = require('../../../src/data-access/repositories');

jest.mock('../../../src/data-access/repositories');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('uuid');

describe('Auth Service', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    first_name: 'Test',
    last_name: 'User',
  };
  const mockUserData = {
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uuidv4.mockReturnValue('new-uuid');
    bcrypt.hash.mockResolvedValue('hashedpassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockAccessToken');
    config.jwt.secret = 'testsecret';
    config.jwt.accessExpirationMinutes = 30;
  });

  describe('registerUser', () => {
    it('should successfully register a user if email is not taken', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await authService.registerUser(mockUserData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        id: 'new-uuid',
        email: mockUserData.email,
        password: 'hashedpassword',
      }));
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError if email is already taken', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.registerUser(mockUserData)).rejects.toThrow(ApiError);
      await expect(authService.registerUser(mockUserData)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(authService.registerUser(mockUserData)).rejects.toHaveProperty('message', 'Email already taken');
    });
  });

  describe('loginUserWithEmailAndPassword', () => {
    it('should successfully login a user with correct credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockUserData.password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toHaveProperty('statusCode', httpStatus.UNAUTHORIZED);
      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toHaveProperty('message', 'Incorrect email or password');
    });

    it('should throw ApiError if password is incorrect', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toHaveProperty('statusCode', httpStatus.UNAUTHORIZED);
      await expect(authService.loginUserWithEmailAndPassword(mockUserData.email, mockUserData.password)).rejects.toHaveProperty('message', 'Incorrect email or password');
    });
  });

  describe('generateAuthTokens', () => {
    it('should generate access token for a user', () => {
      const tokens = authService.generateAuthTokens(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        config.jwt.secret,
        { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
      );
      expect(tokens).toEqual({
        accessToken: 'mockAccessToken',
        expiresIn: config.jwt.accessExpirationMinutes * 60,
      });
    });
  });
});
```