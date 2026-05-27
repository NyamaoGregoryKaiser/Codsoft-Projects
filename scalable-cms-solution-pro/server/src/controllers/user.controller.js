```javascript
const httpStatus = require('http-status');
const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { users, totalUsers, totalPages, currentPage } = await userService.queryUsers(page, limit);
    res.status(httpStatus.OK).json({ users, totalUsers, totalPages, currentPage });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authenticated');
    }
    res.status(httpStatus.OK).json(req.user.toJSON());
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.status(httpStatus.OK).json(user.toJSON());
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const authenticatedUser = req.user; // User from JWT token

    // A user can update their own profile, or an admin/editor can update any user
    if (authenticatedUser.id !== userId && !['admin', 'editor'].includes(authenticatedUser.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this user.');
    }

    // Prevent non-admins from changing roles
    if (req.body.role && authenticatedUser.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can change user roles.');
    }

    const updatedUser = await userService.updateUserById(userId, req.body);
    logger.info(`User ${userId} updated by ${authenticatedUser.id}`);
    res.status(httpStatus.OK).json(updatedUser.toJSON());
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await userService.deleteUserById(userId);
    logger.info(`User ${userId} deleted by ${req.user.id}`);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
```