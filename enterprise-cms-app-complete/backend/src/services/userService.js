const { User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all users.
 * @param {object} queryOptions - Options for pagination, filtering, etc.
 * @returns {object} - Paginated list of users.
 */
const getAllUsers = async (queryOptions = {}) => {
  const { limit = 10, offset = 0, role, status } = queryOptions;

  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;

  const users = await User.findAndCountAll({
    where,
    attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
  });

  logger.info(`Fetched ${users.rows.length} users.`);
  return users;
};

/**
 * Get a single user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {object} - The user object.
 * @throws {ApiError} 404 if user not found.
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt', 'lastLogin'],
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  logger.info(`Fetched user with ID: ${userId}`);
  return user;
};

/**
 * Update a user.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Data to update (e.g., username, email, role, status).
 * @param {object} requestingUser - The user making the request.
 * @returns {object} - Updated user object.
 * @throws {ApiError} 403 if attempting to change admin role without being admin.
 * @throws {ApiError} 404 if user not found.
 * @throws {ApiError} 400 if email/username already exists.
 */
const updateUser = async (userId, updateData, requestingUser) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Prevent non-admins from changing roles or status of other users, or their own role to admin
  if (requestingUser.role !== 'admin') {
    if (userId !== requestingUser.id) {
      if (updateData.role || updateData.status) {
        throw new ApiError(403, 'Forbidden: Only admins can change other users\' roles or status.');
      }
    } else { // User is trying to update their own profile
      if (updateData.role && updateData.role !== requestingUser.role) {
        throw new ApiError(403, 'Forbidden: You cannot change your own role.');
      }
      if (updateData.status && updateData.status !== requestingUser.status) {
        throw new ApiError(403, 'Forbidden: You cannot change your own status.');
      }
    }
  }

  // Check for duplicate username/email if they are being updated
  if (updateData.email && updateData.email !== user.email) {
    const existingEmailUser = await User.findOne({ where: { email: updateData.email } });
    if (existingEmailUser) {
      throw new ApiError(400, 'User with this email already exists.');
    }
  }
  if (updateData.username && updateData.username !== user.username) {
    const existingUsernameUser = await User.findOne({ where: { username: updateData.username } });
    if (existingUsernameUser) {
      throw new ApiError(400, 'User with this username already exists.');
    }
  }

  // Sanitize update data for specific roles
  const allowedUpdates = {};
  if (requestingUser.role === 'admin') {
    Object.assign(allowedUpdates, updateData);
  } else {
    // Non-admins can only update certain fields for themselves or if specifically allowed
    if (updateData.username) allowedUpdates.username = updateData.username;
    if (updateData.email) allowedUpdates.email = updateData.email;
    // Password change is handled via a separate endpoint/flow usually, but here, it would be direct
    if (updateData.password) allowedUpdates.password = updateData.password;
  }

  await user.update(allowedUpdates);

  logger.info(`User with ID: ${userId} updated by ${requestingUser.email}`);
  return user;
};

/**
 * Delete a user.
 * @param {string} userId - The ID of the user to delete.
 * @param {object} requestingUser - The user making the request.
 * @throws {ApiError} 403 if a non-admin tries to delete an admin or themselves.
 * @throws {ApiError} 404 if user not found.
 */
const deleteUser = async (userId, requestingUser) => {
  const userToDelete = await User.findByPk(userId);

  if (!userToDelete) {
    throw new ApiError(404, 'User not found.');
  }

  // Admins cannot delete themselves or the last admin
  if (userToDelete.role === 'admin' && userId === requestingUser.id) {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      throw new ApiError(403, 'Forbidden: Cannot delete the last admin user, or self-delete as an admin.');
    }
  }

  // Non-admins cannot delete other users or admins
  if (requestingUser.role !== 'admin' && userId !== requestingUser.id) {
    throw new ApiError(403, 'Forbidden: Only admins can delete other users.');
  }
  if (requestingUser.role !== 'admin' && userToDelete.role === 'admin') {
    throw new ApiError(403, 'Forbidden: Cannot delete an admin user.');
  }

  await userToDelete.destroy();
  logger.info(`User with ID: ${userId} deleted by ${requestingUser.email}`);
  return { message: 'User deleted successfully.' };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};