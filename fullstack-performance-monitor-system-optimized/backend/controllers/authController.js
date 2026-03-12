```javascript
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Handles user registration.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const { user, token } = await authService.registerUser({ username, email, password });
    res.status(201).json({
      status: 'success',
      data: { user, token },
      message: 'User registered successfully. Welcome!',
    });
  } catch (error) {
    logger.error('Registration error:', error.message);
    next(error); // Pass error to centralized error handler
  }
};

/**
 * Handles user login.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({
      status: 'success',
      data: { user, token },
      message: 'Logged in successfully. Welcome back!',
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    next(error);
  }
};

module.exports = {
  register,
  login,
};
```