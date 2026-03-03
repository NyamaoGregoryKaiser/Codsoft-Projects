const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

// Helper to add instance methods to a user object fetched from DB
const enhanceUser = (user) => {
  if (!user) return null;
  user.isPasswordMatch = async function (password) {
    return bcrypt.compare(password, this.password);
  };
  user.toPublicJSON = function () {
    const { password, ...publicUser } = this;
    return publicUser;
  };
  return user;
};

const createUser = async (userData) => {
  if (await db('users').where({ email: userData.email }).first()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const [userId] = await db('users').insert({
    ...userData,
    password: hashedPassword,
    role: 'user', // default role
  }).returning('id');

  const user = await db('users').where({ id: userId }).first();
  return enhanceUser(user);
};

const getUserByEmail = async (email) => {
  const user = await db('users').where({ email }).first();
  return enhanceUser(user);
};

const getUserById = async (id) => {
  const user = await db('users').where({ id }).first();
  return enhanceUser(user);
};

const queryUsers = async (filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const users = await db('users')
    .where(filter)
    .limit(limit)
    .offset(offset)
    .orderBy(sortBy.split(':')[0], sortBy.split(':')[1]);

  const totalResults = await db('users').where(filter).count('id as count').first();

  return {
    results: users.map(enhanceUser),
    page,
    limit,
    totalPages: Math.ceil(totalResults.count / limit),
    totalResults: totalResults.count,
  };
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && updateBody.email !== user.email && (await getUserByEmail(updateBody.email))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 10);
  }

  await db('users').where({ id: userId }).update(updateBody);
  const updatedUser = await getUserById(userId);
  return enhanceUser(updatedUser);
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await db('users').where({ id: userId }).del();
  return user.toPublicJSON();
};


module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  queryUsers,
  updateUserById,
  deleteUserById,
};