const httpStatus = require('http-status');
const { authService, userService } = require('../../src/services');
const ApiError = require('../../src/utils/ApiError');
const { generateToken } = require('../../src/utils/jwt');
const { User } = require('../../src/models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

jest.mock('../../src/models', () => ({
  User: {
    scope: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn()
}));

describe('Auth Service', () => {
  const mockUserId = uuidv4();
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    password: 'hashedpassword',
    isPasswordMatch: jest.fn()
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    User.scope.mockReturnThis(); // Ensure scope returns chainable object
  });

  describe('loginUserWithEmailAndPassword', () => {
    it('should return user if email and password are correct', async () => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.isPasswordMatch.mockResolvedValue(true);

      const result = await authService.loginUserWithEmailAndPassword(
        mockUser.email,
        'correctpassword'
      );

      expect(User.scope).toHaveBeenCalledWith('withPassword');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(mockUser.isPasswordMatch).toHaveBeenCalledWith('correctpassword');
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError (UNAUTHORIZED) if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password'))
        .rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password'))
        .rejects.toHaveProperty('statusCode', httpStatus.UNAUTHORIZED);
    });

    it('should throw ApiError (UNAUTHORIZED) if password incorrect', async () => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.isPasswordMatch.mockResolvedValue(false);

      await expect(authService.loginUserWithEmailAndPassword(mockUser.email, 'incorrectpassword'))
        .rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword(mockUser.email, 'incorrectpassword'))
        .rejects.toHaveProperty('statusCode', httpStatus.UNAUTHORIZED);
    });
  });

  describe('generateAuthToken', () => {
    it('should generate a token for the given user ID', async () => {
      const expectedToken = 'some-jwt-token';
      generateToken.mockReturnValue(expectedToken);

      const token = await authService.generateAuthToken(mockUserId);

      expect(generateToken).toHaveBeenCalledWith(mockUserId);
      expect(token).toEqual(expectedToken);
    });
  });
});
```

```