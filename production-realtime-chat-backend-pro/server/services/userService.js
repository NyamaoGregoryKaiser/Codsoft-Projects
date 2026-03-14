```javascript
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/winston');

/**
 * Get all users.
 * @returns {Array<User>} A list of all users.
 */
exports.getAllUsers = async () => {
  const users = await User.find().select('-password -__v');
  logger.debug('Fetched all users.');
  return users;
};

/**
 * Get a single user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {User} The user object.
 * @throws {ErrorResponse} If user is not found.
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password -__v').populate({
    path: 'rooms',
    select: 'name isPrivate'
  });

  if (!user) {
    logger.warn(`User not found with ID: ${userId}`);
    throw new ErrorResponse(`User not found with ID: ${userId}`, 404);
  }
  logger.debug(`Fetched user by ID: ${userId}`);
  return user;
};

/**
 * Update a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updateData - Data to update (e.g., username, email).
 * @returns {User} The updated user object.
 * @throws {ErrorResponse} If user not found or update fails.
 */
exports.updateUser = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password -__v');

  if (!user) {
    logger.warn(`Attempted to update non-existent user with ID: ${userId}`);
    throw new ErrorResponse(`User not found with ID: ${userId}`, 404);
  }
  logger.info(`User updated: ${userId}`);
  return user;
};

/**
 * Delete a user.
 * @param {string} userId - The ID of the user to delete.
 * @throws {ErrorResponse} If user not found.
 */
exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    logger.warn(`Attempted to delete non-existent user with ID: ${userId}`);
    throw new ErrorResponse(`User not found with ID: ${userId}`, 404);
  }

  await user.deleteOne(); // Use deleteOne for pre-middleware to run
  logger.info(`User deleted: ${userId}`);
};
```