```javascript
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Retrieves all users. (Admin only)
 * @returns {Array<Object>} List of users.
 */
const getAllUsers = async () => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] }
  });
  return users;
};

/**
 * Retrieves a single user by ID.
 * @param {string} id - The user ID.
 * @returns {Object} User data.
 * @throws {Error} If user not found.
 */
const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Updates a user's profile.
 * @param {string} id - The user ID.
 * @param {Object} userData - Data to update.
 * @returns {Object} Updated user data.
 * @throws {Error} If user not found or update fails.
 */
const updateUserProfile = async (id, userData) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Only allow updating specific fields
  user.username = userData.username || user.username;
  user.email = userData.email || user.email;
  if (userData.password) {
    user.password = userData.password; // Pre-save hook will hash it
  }

  await user.save();
  logger.info(`User profile updated for user ID: ${id}`);
  // Return user without password
  const updatedUser = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
  return updatedUser;
};

/**
 * Deletes a user by ID. (Admin only)
 * @param {string} id - The user ID.
 * @throws {Error} If user not found or deletion fails.
 */
const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  await user.destroy();
  logger.info(`User deleted: ${id}`);
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  deleteUser,
};
```