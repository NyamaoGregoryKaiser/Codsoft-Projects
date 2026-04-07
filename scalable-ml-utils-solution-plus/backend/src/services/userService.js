```javascript
const db = require('../db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const getAllUsers = async () => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] } // Exclude password hash
    });
    logger.debug('Fetched all users.');
    return users;
  } catch (error) {
    logger.error('Error fetching all users:', error);
    throw new AppError('Could not retrieve users.', 500);
  }
};

const getUserById = async (id) => {
  try {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    logger.debug(`Fetched user by ID: ${id}`);
    return user;
  } catch (error) {
    logger.error(`Error fetching user by ID ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not retrieve user.', 500);
  }
};

const updateUser = async (id, data) => {
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Only allow updating specific fields
    const allowedUpdates = ['username', 'email'];
    if (data.role && user.role !== 'admin') {
      throw new AppError('Only administrators can change roles.', 403);
    }
    if (user.role === 'admin' && data.role) {
      allowedUpdates.push('role');
    }

    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        user[key] = data[key];
      }
    });

    await user.save();
    logger.info(`User updated: ${id}`);
    // Return updated user without password
    const updatedUser = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user ${id}:`, error);
    if (error.name === 'AppError') throw error;
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Username or email already in use.', 400);
    }
    throw new AppError('Could not update user.', 500);
  }
};

const deleteUser = async (id) => {
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    await user.destroy();
    logger.info(`User deleted: ${id}`);
    return { message: 'User deleted successfully.' };
  } catch (error) {
    logger.error(`Error deleting user ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not delete user.', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
```