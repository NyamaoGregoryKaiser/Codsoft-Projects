const userService = require('../services/userService');
const logger = require('../utils/logger');

/**
 * Retrieves all users with pagination and optional filters.
 * Accessible only by 'admin' role.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      role: req.query.role,
      isActive: req.query.isActive ? (req.query.isActive === 'true') : undefined,
      search: req.query.search
    };

    const users = await userService.getAllUsers(page, limit, filters);

    res.status(200).json({
      success: true,
      data: users.data,
      pagination: users.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single user by ID.
 * Accessible only by 'admin' role.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new user.
 * Accessible only by 'admin' role.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, isActive } = req.body;

    if (!username || !email || !password || !role) {
      const error = new Error('Please provide username, email, password, and role for the new user.');
      error.statusCode = 400;
      throw error;
    }

    const newUser = await userService.createUser({ username, email, password, role, isActive });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing user.
 * Accessible only by 'admin' role.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No update data provided.');
      error.statusCode = 400;
      throw error;
    }

    // Prevent updating 'id' or 'createdAt'/'updatedAt'
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedUser = await userService.updateUser(id, updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a user.
 * Accessible only by 'admin' role.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) { // Prevent an admin from deleting themselves
      const error = new Error('Cannot delete your own user account through this endpoint.');
      error.statusCode = 403;
      throw error;
    }

    const deletedCount = await userService.deleteUser(id);

    if (deletedCount === 0) {
      const error = new Error(`User with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
```