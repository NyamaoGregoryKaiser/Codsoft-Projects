const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('@config/db');
const config = require('@config');
const logger = require('@utils/logger');

/**
 * Registers a new user.
 * @param {string} username - The user's chosen username.
 * @param {string} password - The user's chosen password.
 * @returns {Promise<object>} An object containing the user and a JWT token.
 * @throws {Error} If the username already exists or registration fails.
 */
const registerUser = async (username, password) => {
  const userExists = await prisma.user.findUnique({ where: { username } });

  if (userExists) {
    logger.warn(`Attempt to register existing username: ${username}`);
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: 'user', // Default role
    },
    select: { id: true, username: true, role: true },
  });

  const token = generateToken(user.id);
  logger.info(`User registered successfully: ${user.username}`);
  return { user, token };
};

/**
 * Authenticates a user and generates a JWT token.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} An object containing the user and a JWT token.
 * @throws {Error} If authentication fails (invalid credentials).
 */
const loginUser = async (username, password) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    logger.warn(`Login attempt with non-existent username: ${username}`);
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    logger.warn(`Login attempt with incorrect password for user: ${username}`);
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user.id);
  logger.info(`User logged in successfully: ${user.username}`);
  return { user: { id: user.id, username: user.username, role: user.role }, token };
};

/**
 * Generates a JWT token for a given user ID.
 * @param {string} id - The user ID.
 * @returns {string} The JWT token.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};