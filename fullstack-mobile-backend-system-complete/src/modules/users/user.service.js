```javascript
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const prisma = require('../../database/prisma');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Check if email is taken
 * @param {string} email
 * @param {string} [excludeUserId] - Exclude user with this ID from the check (for update scenarios)
 * @returns {Promise<boolean>}
 */
const isEmailTaken = async (email, excludeUserId) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      NOT: excludeUserId ? { id: excludeUserId } : undefined,
    },
  });
  return !!user;
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await bcrypt.hash(userBody.password, 10);
  const user = await prisma.user.create({
    data: {
      ...userBody,
      password: hashedPassword,
    },
  });
  // Omit password from response
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  const orderBy = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    orderBy[parts[0]] = parts[1];
  } else {
    orderBy.createdAt = 'desc'; // Default sort
  }

  const users = await prisma.user.findMany({
    where: filter,
    take: limit,
    skip: skip,
    orderBy: orderBy,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }, // Exclude password
  });

  const totalResults = await prisma.user.count({ where: filter });
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: users,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Update user by id
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updatedUser;
};

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  // Return the deleted user for confirmation (without password)
  const { password, ...deletedUserWithoutPassword } = user;
  return deletedUserWithoutPassword;
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