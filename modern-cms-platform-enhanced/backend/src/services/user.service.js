```javascript
const httpStatus = require('http-status-codes');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.findOne({ where: { email: userBody.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await User.findOne({ where: { username: userBody.username } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Sequelize filter
 * @param {Object} options - Query options (limit, page, sortBy)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const order = sortBy.split(',').map((sortOption) => {
    const [field, sortOrder] = sortOption.split(':');
    return [field, sortOrder.toUpperCase()];
  });

  const { count, rows } = await User.findAndCountAll({
    where: filter,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: order,
  });

  return {
    results: rows,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get user by ID
 * @param {UUID} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findByPk(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

/**
 * Update user by ID
 * @param {UUID} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.findOne({ where: { email: updateBody.email } })) && (await User.findOne({ where: { email: updateBody.email } })).id !== userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.username && (await User.findOne({ where: { username: updateBody.username } })) && (await User.findOne({ where: { username: updateBody.username } })).id !== userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by ID
 * @param {UUID} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.destroy();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
```