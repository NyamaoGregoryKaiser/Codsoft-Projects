const userService = require('../services/userService');
const { ApiError } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * Joi schema for updating user validation.
 */
const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).optional(), // Password change typically has its own endpoint
  role: Joi.string().valid('admin', 'editor', 'author', 'subscriber').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
}).min(1); // At least one field must be provided for update

/**
 * Get all users.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { limit, offset, role, status } = req.query;
    const users = await userService.getAllUsers({ limit, offset, role, status });
    res.status(200).json({
      status: 'success',
      data: users.rows,
      meta: {
        total: users.count,
        limit: parseInt(limit, 10) || 10,
        offset: parseInt(offset, 10) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a user by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updateUser = async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const updatedUser = await userService.updateUser(req.params.id, value, req.user);
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};