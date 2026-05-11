const { User } = require('../models');
const logger = require('../utils/logger');
const { Sequelize } = require('../models'); // Import Sequelize to catch specific errors
const { Op } = require('sequelize'); // For advanced query operators

/**
 * Retrieves all users with pagination and filtering.
 * @param {number} page - Current page number.
 * @param {number} limit - Number of users per page.
 * @param {Object} filters - Optional filters (e.g., { role: 'admin' }).
 * @returns {Object} - Paginated list of users and total count.
 */
const getAllUsers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.role) {
      whereClause.role = filters.role;
    }
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    if (filters.search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] } // Always exclude password
    });

    logger.debug(`Retrieved ${users.length} users (total: ${count}) for page ${page}, limit ${limit}.`);

    return {
      data: users,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error(`Error fetching all users: ${error.message}`, { stack: error.stack, page, limit, filters });
    throw error;
  }
};

/**
 * Retrieves a single user by ID.
 * @param {string} id - The UUID of the user.
 * @returns {Object} - The user object.
 * @throws {Error} If user is not found.
 */
const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      const error = new Error(`User with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    logger.debug(`Retrieved user with ID: ${id}`);
    return user;
  } catch (error) {
    logger.error(`Error fetching user by ID ${id}: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Creates a new user.
 * @param {Object} userData - Data for the new user (username, email, password, role, isActive).
 * @returns {Object} - The newly created user object.
 * @throws {Error} If user creation fails.
 */
const createUser = async (userData) => {
  try {
    const { username, email, password, role, isActive = true } = userData;

    // Check if user already exists (more robust check than just unique constraint error)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const error = new Error('User with this email or username already exists');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({ username, email, password, role, isActive });

    logger.info(`User created with ID: ${user.id}`);
    // Exclude password from the returned object
    const userResponse = user.toJSON();
    delete userResponse.password;
    return userResponse;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`, { stack: error.stack, userData });
    throw error;
  }
};

/**
 * Updates an existing user.
 * @param {string} id - The UUID of the user to update.
 * @param {Object} updateData - Data to update the user with.
 * @returns {Object} - The updated user object.
 * @throws {Error} If user is not found or update fails.
 */
const updateUser = async (id, updateData) => {
  try {
    const user = await User.findByPk(id);

    if (!user) {
      const error = new Error(`User with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Handle unique constraints for username and email before update
    if (updateData.username && updateData.username !== user.username) {
      const existingUsernameUser = await User.findOne({ where: { username: updateData.username } });
      if (existingUsernameUser && existingUsernameUser.id !== user.id) {
        const error = new Error('Username is already taken');
        error.statusCode = 409;
        throw error;
      }
    }
    if (updateData.email && updateData.email !== user.email) {
      const existingEmailUser = await User.findOne({ where: { email: updateData.email } });
      if (existingEmailUser && existingEmailUser.id !== user.id) {
        const error = new Error('Email is already taken');
        error.statusCode = 409;
        throw error;
      }
    }

    await user.update(updateData);

    logger.info(`User updated with ID: ${id}`);
    // Exclude password from the returned object
    const userResponse = user.toJSON();
    delete userResponse.password;
    return userResponse;
  } catch (error) {
    logger.error(`Error updating user with ID ${id}: ${error.message}`, { stack: error.stack, updateData });
    throw error;
  }
};

/**
 * Deletes a user.
 * @param {string} id - The UUID of the user to delete.
 * @returns {number} - The number of destroyed rows (1 if successful, 0 otherwise).
 * @throws {Error} If user is not found.
 */
const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);

    if (!user) {
      const error = new Error(`User with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    await user.destroy();
    logger.info(`User deleted with ID: ${id}`);
    return 1; // Indicate successful deletion
  } catch (error) {
    logger.error(`Error deleting user with ID ${id}: ${error.message}`, { stack: error.stack });
    throw error;
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