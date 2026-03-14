```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../db/models');
const { createError } = require('../utils/errorHandler');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Hashes a plain password.
 * @param {string} password - The plain password.
 * @returns {Promise<string>} Hashed password.
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain password with a hashed password.
 * @param {string} plainPassword - The plain password.
 * @param {string} hashedPassword - The hashed password from the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
const comparePasswords = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generates a JWT token for a user.
 * @param {object} user - User object containing id and role.
 * @returns {string} JWT token.
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    roleId: user.roleId, // Include role ID in token payload
    roleName: user.Role ? user.Role.name : 'Guest' // Include role name for convenience
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

/**
 * Registers a new user.
 * @param {string} username - User's chosen username.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<{user: object, token: string}>} Registered user and JWT token.
 * @throws {Error} If user with email or username already exists.
 */
exports.registerUser = async (username, email, password) => {
  // Check if user with this email or username already exists
  const existingUser = await User.findOne({
    where: {
      $or: [{ email }, { username }]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw createError(400, 'User with this email already exists.');
    }
    if (existingUser.username === username) {
      throw createError(400, 'User with this username already exists.');
    }
  }

  const hashedPassword = await hashPassword(password);

  // Assign default role (e.g., 'Author' or 'User')
  // In a real scenario, you'd fetch the default role ID from the DB
  const defaultRole = await Role.findOne({ where: { name: 'Author' } });
  if (!defaultRole) {
    logger.warn('Default role "Author" not found. Assigning null roleId.');
  }

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    roleId: defaultRole ? defaultRole.id : null,
  });

  // Fetch the user again to include the associated Role for token generation and response
  const userWithRole = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'Role' }]
  });

  const token = generateToken(userWithRole);
  logger.info(`New user registered: ${user.email} with role ${userWithRole.Role ? userWithRole.Role.name : 'N/A'}`);

  return { user: userWithRole, token };
};

/**
 * Logs in a user.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<{user: object, token: string}>} Logged-in user and JWT token.
 * @throws {Error} If credentials are invalid.
 */
exports.loginUser = async (email, password) => {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'Role' }] // Eager load role
  });

  if (!user || !(await comparePasswords(password, user.password))) {
    throw createError(401, 'Invalid credentials');
  }

  const token = generateToken(user);
  logger.info(`User logged in: ${user.email} with role ${user.Role ? user.Role.name : 'N/A'}`);

  return { user, token };
};

/**
 * Finds a user by ID.
 * @param {number} id - User ID.
 * @returns {Promise<object|null>} User object or null if not found.
 */
exports.getUserById = async (id) => {
  return User.findByPk(id, {
    attributes: { exclude: ['password'] }, // Exclude password from the returned object
    include: [{ model: Role, as: 'Role' }]
  });
};
```