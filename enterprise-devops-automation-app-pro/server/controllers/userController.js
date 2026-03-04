const { User } = require('../models');
const logger = require('../utils/logger');
const redisClient = require('../utils/redisClient');

const USER_CACHE_KEY = 'all_users';

exports.getAllUsers = async (req, res, next) => {
  try {
    // Try to get from cache
    const cachedUsers = await redisClient.get(USER_CACHE_KEY);
    if (cachedUsers) {
      logger.info('Serving users from cache');
      return res.status(200).json({
        status: 'success',
        results: JSON.parse(cachedUsers).length,
        data: { users: JSON.parse(cachedUsers) },
      });
    }

    const users = await User.findAll({ attributes: { exclude: ['password'] } });

    // Store in cache for 1 hour
    await redisClient.set(USER_CACHE_KEY, JSON.stringify(users), { EX: 3600 });
    logger.info('Serving users from DB and caching');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users },
    });
  } catch (err) {
    next(new Error(`Failed to retrieve users: ${err.message}`, { cause: 500 }));
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cachedUser = await redisClient.get(`user:${id}`);
    if (cachedUser) {
      logger.info(`Serving user ${id} from cache`);
      return res.status(200).json({
        status: 'success',
        data: { user: JSON.parse(cachedUser) },
      });
    }

    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });

    if (!user) {
      return next(new Error('User not found with that ID.', { cause: 404 }));
    }

    // Store in cache for 1 hour
    await redisClient.set(`user:${id}`, JSON.stringify(user), { EX: 3600 });
    logger.info(`Serving user ${id} from DB and caching`);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(new Error(`Failed to retrieve user: ${err.message}`, { cause: 500 }));
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return next(new Error('Username, email, and password are required.', { cause: 400 }));
    }
    const newUser = await User.create({ username, email, password, role });

    // Invalidate cache for all users
    await redisClient.del(USER_CACHE_KEY);

    newUser.password = undefined; // Remove password from response
    logger.info(`User created: ${newUser.username}`);
    res.status(201).json({
      status: 'success',
      data: { user: newUser },
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new Error('Email or username already in use.', { cause: 409 }));
    }
    if (err.name === 'SequelizeValidationError') {
      return next(new Error(err.errors.map(e => e.message).join(', '), { cause: 400 }));
    }
    next(new Error(`Failed to create user: ${err.message}`, { cause: 500 }));
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body; // Password updates should be a separate endpoint for security

    const user = await User.findByPk(id);

    if (!user) {
      return next(new Error('User not found with that ID.', { cause: 404 }));
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role; // Only admins should change roles

    await user.save({ fields: ['username', 'email', 'role'] }); // Specify fields to update

    // Invalidate cache for this user and all users
    await redisClient.del(USER_CACHE_KEY);
    await redisClient.del(`user:${id}`);

    user.password = undefined;
    logger.info(`User updated: ${user.username}`);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new Error('Email or username already in use.', { cause: 409 }));
    }
    if (err.name === 'SequelizeValidationError') {
      return next(new Error(err.errors.map(e => e.message).join(', '), { cause: 400 }));
    }
    next(new Error(`Failed to update user: ${err.message}`, { cause: 500 }));
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return next(new Error('User not found with that ID.', { cause: 404 }));
    }

    await user.destroy();

    // Invalidate cache for this user and all users
    await redisClient.del(USER_CACHE_KEY);
    await redisClient.del(`user:${id}`);

    logger.info(`User deleted: ${user.username}`);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(new Error(`Failed to delete user: ${err.message}`, { cause: 500 }));
  }
};