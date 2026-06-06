```javascript
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const userService = require('./user.service');
const ApiError = require('../../utils/ApiError');

/**
 * Create a new user (Admin only).
 * @param {Object} req - Express request object
 *   @property {Object} req.body - User data (name, email, password, role)
 * @param {Object} res - Express response object
 */
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

/**
 * Get all users.
 * Supports filtering and pagination.
 * @param {Object} req - Express request object
 *   @property {Object} req.query - Query parameters for filtering (name, email, role) and pagination (page, limit)
 * @param {Object} res - Express response object
 */
const getUsers = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
  if (req.query.email) filter.email = { contains: req.query.email, mode: 'insensitive' };
  if (req.query.role) filter.role = req.query.role.toUpperCase(); // Ensure role is uppercase for enum

  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sortBy: req.query.sortBy,
  };

  const result = await userService.queryUsers(filter, options);
  res.status(httpStatus.OK).send(result);
});

/**
 * Get a single user by ID.
 * @param {Object} req - Express request object
 *   @property {string} req.params.userId - ID of the user to retrieve
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // Allow user to view their own profile, or admin to view any profile
  if (user.id !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }
  res.status(httpStatus.OK).send(user);
});

/**
 * Update a user by ID.
 * @param {Object} req - Express request object
 *   @property {string} req.params.userId - ID of the user to update
 *   @property {Object} req.body - Updated user data (name, email, password, role)
 *   @property {Object} req.user - Authenticated user (for authorization)
 * @param {Object} res - Express response object
 */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // Allow user to update their own profile, or admin to update any profile
  if (user.id !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }
  // If a regular user tries to change their role, it's forbidden
  if (user.role === 'USER' && req.body.role && req.body.role !== 'USER' && req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Users are not allowed to change their role');
  }

  const updatedUser = await userService.updateUserById(req.params.userId, req.body);
  res.status(httpStatus.OK).send(updatedUser);
});

/**
 * Delete a user by ID (Admin only).
 * @param {Object} req - Express request object
 *   @property {string} req.params.userId - ID of the user to delete
 * @param {Object} res - Express response object
 */
const deleteUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // Only admin can delete users
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden to delete users');
  }

  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
```