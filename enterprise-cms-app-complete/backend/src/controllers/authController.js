const authService = require('../services/authService');
const { ApiError } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * Joi schema for user registration validation.
 */
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'editor', 'author', 'subscriber').default('subscriber').optional(),
});

/**
 * Joi schema for user login validation.
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Register a new user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    // Only allow admin to set role during registration (if not already an admin trying to create admin)
    if (value.role && value.role !== 'subscriber' && (!req.user || req.user.role !== 'admin')) {
      delete value.role; // Remove role if not allowed to set
      if (!req.user) {
        throw new ApiError(403, 'Forbidden: You cannot set a custom role during registration.');
      }
      throw new ApiError(403, 'Forbidden: Only admins can assign roles other than "subscriber".');
    }

    const { user, token } = await authService.registerUser(value);
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in a user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const { user, token } = await authService.loginUser(value.email, value.password);
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the profile of the authenticated user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};