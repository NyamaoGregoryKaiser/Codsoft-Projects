```javascript
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Retrieves a user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {object} - User object (without password hash).
 * @throws {Error} If user not found.
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'createdAt'],
    });
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error.message);
    throw new Error(`Failed to retrieve user: ${error.message}`);
  }
};

/**
 * Updates a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Data to update (e.g., username, email, password).
 * @returns {object} - Updated user object.
 * @throws {Error} If update fails or user not found.
 */
const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Only allow specific fields to be updated
    if (updateData.username) user.username = updateData.username;
    if (updateData.email) user.email = updateData.email;
    if (updateData.password) user.passwordHash = updateData.password; // Model hook will hash it

    await user.save();
    logger.info(`User ${userId} updated successfully.`);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    logger.error(`Error updating user ${userId}:`, error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Username or email already in use.');
    }
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

/**
 * Deletes a user.
 * @param {string} userId - The ID of the user to delete.
 * @returns {boolean} - True if deletion was successful.
 * @throws {Error} If deletion fails or user not found.
 */
const deleteUser = async (userId) => {
  try {
    const deletedRows = await User.destroy({ where: { id: userId } });
    if (deletedRows === 0) {
      throw new Error('User not found.');
    }
    logger.info(`User ${userId} deleted successfully.`);
    return true;
  } catch (error) {
    logger.error(`Error deleting user ${userId}:`, error.message);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
};
```