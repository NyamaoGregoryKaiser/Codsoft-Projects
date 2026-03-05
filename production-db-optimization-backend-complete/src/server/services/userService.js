const knex = require('../db/knex');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');

const TABLE_NAME = 'users';

const createUser = async (username, email, passwordHash, role = 'user') => {
  try {
    const [user] = await knex(TABLE_NAME).insert({
      username,
      email,
      password_hash: passwordHash,
      role,
    }).returning(['id', 'username', 'email', 'role', 'created_at']);
    return user;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    throw new APIError('Could not create user', 500);
  }
};

const findUserById = async (id) => {
  try {
    const user = await knex(TABLE_NAME).select('id', 'username', 'email', 'role', 'created_at')
      .where({ id }).first();
    return user;
  } catch (error) {
    logger.error(`Error finding user by ID ${id}: ${error.message}`);
    throw new APIError('Could not find user', 500);
  }
};

const findUserByEmail = async (email) => {
  try {
    const user = await knex(TABLE_NAME).select('*') // Need password_hash for login
      .where({ email }).first();
    return user;
  } catch (error) {
    logger.error(`Error finding user by email ${email}: ${error.message}`);
    throw new APIError('Could not find user', 500);
  }
};

const getAllUsers = async () => {
  try {
    return await knex(TABLE_NAME).select('id', 'username', 'email', 'role', 'created_at');
  } catch (error) {
    logger.error(`Error getting all users: ${error.message}`);
    throw new APIError('Could not retrieve users', 500);
  }
};

const updateUser = async (id, userData) => {
  try {
    const updatedUser = await knex(TABLE_NAME)
      .where({ id })
      .update(userData)
      .returning(['id', 'username', 'email', 'role', 'updated_at']);
    if (!updatedUser || updatedUser.length === 0) {
      throw new APIError('User not found or nothing to update', 404);
    }
    return updatedUser[0];
  } catch (error) {
    logger.error(`Error updating user ${id}: ${error.message}`);
    throw new APIError('Could not update user', 500);
  }
};

const deleteUser = async (id) => {
  try {
    const deletedCount = await knex(TABLE_NAME).where({ id }).del();
    if (deletedCount === 0) {
      throw new APIError('User not found', 404);
    }
    return { message: 'User deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting user ${id}: ${error.message}`);
    throw new APIError('Could not delete user', 500);
  }
};


module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
};