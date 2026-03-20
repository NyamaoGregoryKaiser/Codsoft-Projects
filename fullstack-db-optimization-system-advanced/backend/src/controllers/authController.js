const asyncHandler = require('express-async-handler');
const authService = require('@services/authService');
const logger = require('@utils/logger');

/**
 * @desc Register new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const { user, token } = await authService.registerUser(username, password);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      token,
    },
  });
});

/**
 * @desc Authenticate a user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  const { user, token } = await authService.loginUser(username, password);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      token,
    },
  });
});

/**
 * @desc Get current user profile (after token validation)
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user data not found in request');
  }
  res.status(200).json({
    success: true,
    message: 'User profile fetched',
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};