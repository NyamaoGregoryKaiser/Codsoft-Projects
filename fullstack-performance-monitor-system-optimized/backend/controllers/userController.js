```javascript
const userService = require('../services/userService');
const logger = require('../utils/logger');

/**
 * Get the profile of the authenticated user.
 * Assumes `req.user` is populated by `authenticateToken` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: user,
      message: 'User profile retrieved successfully.',
    });
  } catch (error) {
    logger.error(`Error retrieving profile for user ${req.user.id}:`, error.message);
    next(error);
  }
};

/**
 * Update the profile of the authenticated user.
 * Assumes `req.user` is populated by `authenticateToken` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updateMe = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      data: updatedUser,
      message: 'User profile updated successfully.',
    });
  } catch (error) {
    logger.error(`Error updating profile for user ${req.user.id}:`, error.message);
    next(error);
  }
};

/**
 * Delete the authenticated user's account.
 * Assumes `req.user` is populated by `authenticateToken` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteMe = async (req, res, next) => {
  try {
    await userService.deleteUser(req.user.id);
    res.status(204).json({
      status: 'success',
      data: null,
      message: 'User account deleted successfully.',
    });
  } catch (error) {
    logger.error(`Error deleting account for user ${req.user.id}:`, error.message);
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  deleteMe,
};
```