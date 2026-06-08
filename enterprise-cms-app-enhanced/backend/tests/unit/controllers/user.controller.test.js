const httpStatus = require('http-status');
const db = require('../../../src/models');
const userController = require('../../../src/controllers/user.controller');
const ApiError = require('../../../src/utils/ApiError');
const { mockRequest, mockResponse, mockNext } = require('../../mocks'); // Helper for mocking req/res

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const newUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user',
    };

    it('should create a new user if email is not taken', async () => {
      jest.spyOn(db.User, 'isEmailTaken').mockResolvedValue(false);
      jest.spyOn(db.User, 'create').mockResolvedValue({ toJSON: () => newUser });

      req.body = newUser;

      await userController.createUser(req, res, next);

      expect(db.User.isEmailTaken).toHaveBeenCalledWith(newUser.email);
      expect(db.User.create).toHaveBeenCalledWith(newUser);
      expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
      expect(res.send).toHaveBeenCalledWith(newUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ApiError if email is already taken', async () => {
      jest.spyOn(db.User, 'isEmailTaken').mockResolvedValue(true);

      req.body = newUser;

      await userController.createUser(req, res, next);

      expect(db.User.isEmailTaken).toHaveBeenCalledWith(newUser.email);
      expect(db.User.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('Email already taken');
    });
  });

  // Add tests for getUsers, getUser, updateUser, deleteUser
});