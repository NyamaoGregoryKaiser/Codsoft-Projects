```javascript
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Register a new user.
 */
exports.register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({ 
            message: 'User registered successfully. Please log in.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration failed:', error.message);
        next(error);
    }
};

/**
 * Log in a user and return a JWT token.
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        logger.error('Login failed:', error.message);
        next(error);
    }
};

/**
 * Get the currently authenticated user's profile.
 */
exports.getMe = async (req, res, next) => {
    try {
        // req.user is set by the authenticate middleware
        res.status(200).json({
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        });
    } catch (error) {
        logger.error('Error fetching user profile:', error.message);
        next(error);
    }
};
```