const httpStatus = require('http-status');
const { userService } = require('../../src/services');
const ApiError = require('../../src/utils/ApiError');
const { User } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    scope: jest.fn().mockReturnThis()
  }
}));

describe('User Service', () => {
  const newUser = {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'newpassword123'
  };
  const mockUserId = uuidv4();
  const mockUser = { id: mockUserId, ...newUser, password: 'hashedpassword' };

  beforeEach(() => {
    jest.clearAllMocks();
    User.scope.mockReturnThis(); // Ensure scope returns chainable object
  });

  describe('createUser', () => {
    it('should successfully create a new user if data is valid and unique', async () => {
      User.findOne.mockResolvedValue(null); // No existing user with email/username
      User.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(newUser);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: newUser.email } });
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: newUser.username } });
      expect(User.create).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError (BAD_REQUEST) if email is already taken', async () => {
      User.findOne.mockImplementationOnce(({ where }) => {
        if (where.email) return Promise.resolve(mockUser); // Email exists
        return Promise.resolve(null);
      });

      await expect(userService.createUser(newUser))
        .rejects.toThrow(ApiError);
      await expect(userService.createUser(newUser))
        .rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(userService.createUser(newUser))
        .rejects.toHaveProperty('message', 'Email already taken');
    });

    it('should throw ApiError (BAD_REQUEST) if username is already taken', async () => {
      User.findOne.mockImplementationOnce(({ where }) => {
        if (where.email) return Promise.resolve(null); // Email doesn't exist
        if (where.username) return Promise.resolve(mockUser); // Username exists
        return Promise.resolve(null);
      });

      await expect(userService.createUser(newUser))
        .rejects.toThrow(ApiError);
      await expect(userService.createUser(newUser))
        .rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(userService.createUser(newUser))
        .rejects.toHaveProperty('message', 'Username already taken');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUserId);

      expect(User.findByPk).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await userService.getUserById(uuidv4());

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found by email', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(newUser.email);

      expect(User.scope).toHaveBeenCalledWith('withPassword');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: newUser.email } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
```

```