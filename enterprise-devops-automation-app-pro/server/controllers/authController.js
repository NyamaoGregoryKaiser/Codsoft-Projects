const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const redisClient = require('../utils/redisClient');

// Helper to send JWT token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Set JWT as a cookie (for browser-based apps, though often just returned in API response)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // e.g., 90 days
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'Lax', // Protect against CSRF
  };
  // Removed cookie setting for simplicity of API only, typically you'd just send the token
  // res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return next(new Error('Please provide username, email, and password.', { cause: 400 }));
    }

    const newUser = await User.create({
      username,
      email,
      password,
      role: role || 'user', // Default to 'user' if not provided
    });

    logger.info(`New user registered: ${newUser.username} (${newUser.email})`);
    createSendToken(newUser, 201, res);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new Error('Email or username already registered.', { cause: 409 }));
    }
    if (err.name === 'SequelizeValidationError') {
      return next(new Error(err.errors.map(e => e.message).join(', '), { cause: 400 }));
    }
    next(new Error(`Registration failed: ${err.message}`, { cause: 500 }));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new Error('Please provide email and password.', { cause: 400 }));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new Error('Incorrect email or password', { cause: 401 }));
    }

    // 3) If everything ok, send token to client
    logger.info(`User logged in: ${user.username} (${user.email})`);
    createSendToken(user, 200, res);
  } catch (err) {
    next(new Error(`Login failed: ${err.message}`, { cause: 500 }));
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Invalidate token by setting a blank/expired cookie or adding token to a blacklist (Redis)
    // For now, we'll just send a success message. For true invalidation, Redis blacklist is ideal.
    // Example of JWT Blacklisting with Redis (conceptual):
    // await redisClient.set(`blacklisted:${token}`, 'true', 'EX', JWT_EXPIRES_IN_SECONDS);
    // In 'protect' middleware, check if token is blacklisted.

    logger.info(`User logged out: ${req.user ? req.user.username : 'Unknown User'}`);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    next(new Error(`Logout failed: ${err.message}`, { cause: 500 }));
  }
};

exports.getMe = (req, res, next) => {
  // req.user is set by the protect middleware
  if (!req.user) {
    return next(new Error('User not found in request.', { cause: 404 }));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};