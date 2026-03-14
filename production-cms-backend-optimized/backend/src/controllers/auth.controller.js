```javascript
const authService = require('../services/auth.service');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const { user, token } = await authService.registerUser(username, email, password);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role ? user.Role.name : 'User' // Include role name if available
      },
      token
    });
  } catch (error) {
    logger.error(`Error during user registration: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Log in an existing user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role ? user.Role.name : 'User'
      },
      token
    });
  } catch (error) {
    logger.error(`Error during user login: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Get current authenticated user's profile.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the auth middleware
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      throw createError(404, 'User not found');
    }
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : 'User',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Log out the current user (e.g., invalidate token if using session or revoke refresh token).
 * For JWT, logout is often client-side by deleting the token.
 * This can be extended to blacklist tokens if necessary.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.logout = async (req, res, next) => {
  try {
    // In a real application, you might want to blacklist the JWT token or manage sessions
    // For stateless JWT, client-side token deletion is sufficient.
    // If using refresh tokens, you'd revoke the refresh token here.
    logger.info(`User ${req.user.id} logged out.`);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Error during user logout: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};
```