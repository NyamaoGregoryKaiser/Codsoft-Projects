```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models'); // Destructure User model directly
const logger = require('../utils/logger');

/**
 * Middleware to protect routes, ensuring only authenticated users can access.
 * Attaches the user object to the request.
 */
exports.authenticate = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Fetch user from the database based on the decoded ID
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] } // Exclude password field
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            logger.error('Authentication error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Middleware for role-based authorization.
 * @param {string[]} roles - An array of roles that are allowed to access the route.
 */
exports.authorize = (roles = []) => {
    return (req, res, next) => {
        // roles param can be a single role string (e.g., 'admin') or an array of roles (e.g., ['admin', 'author'])
        if (typeof roles === 'string') {
            roles = [roles];
        }

        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            logger.warn(`User ${req.user ? req.user.id : 'N/A'} (Role: ${req.user ? req.user.role : 'N/A'}) attempted unauthorized access to a ${roles.join(', ')} protected route.`);
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
        }
        next();
    };
};
```