```javascript
/**
 * @file Handles HTTP requests related to authentication.
 * @module controllers/authController
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiErrors');
const Joi = require('joi');

/**
 * Joi schema for user registration.
 */
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

/**
 * Joi schema for user login.
 */
const loginSchema = Joi.object({
    identifier: Joi.string().required().messages({
        'string.empty': 'Username or email cannot be empty.',
        'any.required': 'Username or email is required.',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password cannot be empty.',
        'any.required': 'Password is required.',
    }),
});

/**
 * Handles user registration.
 * @async
 * @function register
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.register = async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const { user, token } = await authService.registerUser(value);
        res.status(201).json({
            message: 'User registered successfully',
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user login.
 * @async
 * @function login
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.login = async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const { identifier, password } = value;
        const { user, token } = await authService.loginUser(identifier, password);
        res.status(200).json({
            message: 'Logged in successfully',
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user logout.
 * @async
 * @function logout
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.logout = async (req, res, next) => {
    try {
        // req.user is set by authMiddleware
        await authService.logoutUser(req.user.id);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves the profile of the authenticated user.
 * @async
 * @function getProfile
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getProfile = async (req, res, next) => {
    try {
        const user = await authService.getUserProfile(req.user.id); // req.user is from auth middleware
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Updates the profile of the authenticated user.
 * @async
 * @function updateProfile
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateProfile = async (req, res, next) => {
    // Joi schema for profile update (allow partial updates)
    const updateProfileSchema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30),
        email: Joi.string().email(),
        password: Joi.string().min(6),
        status: Joi.string().valid('online', 'offline', 'away'),
    }).min(1); // At least one field is required for update

    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const updatedUser = await authService.updateUserProfile(req.user.id, value);
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};
```