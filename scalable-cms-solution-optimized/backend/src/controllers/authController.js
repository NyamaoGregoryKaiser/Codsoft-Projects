const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Handles user registration.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      const error = new Error('Please enter all required fields: username, email, password');
      error.statusCode = 400;
      throw error;
    }

    const { user, token } = await authService.register({ username, email, password, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
};

/**
 * Handles user login.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Please enter email and password');
      error.statusCode = 400;
      throw error;
    }

    const { user, token } = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the profile of the currently authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by the protect middleware
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
```