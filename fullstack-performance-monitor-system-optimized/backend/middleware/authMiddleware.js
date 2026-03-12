```javascript
const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware to protect routes, ensuring only authenticated users can access them.
 * Attaches user information to the request object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Authentication attempt without token');
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'username', 'email'] });

    if (!user) {
      logger.warn(`User with ID ${decoded.id} not found after token verification.`);
      return res.status(401).json({ message: 'User not found or invalid token.' });
    }

    req.user = user; // Attach user object to the request
    next();
  } catch (error) {
    logger.error('Token authentication failed:', error.message);
    res.status(401).json({ message: error.message || 'Invalid or expired token.' });
  }
};

/**
 * Middleware to authorize access based on application ownership.
 * Assumes `authenticateToken` has already run and `req.user` is available.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizeApplicationOwner = async (req, res, next) => {
  const { appId } = req.params; // Expect appId from route params
  const { Application } = require('../models'); // Import here to avoid circular dependency

  if (!req.user) {
    logger.error('authorizeApplicationOwner middleware called without req.user. Ensure authenticateToken runs first.');
    return res.status(500).json({ message: 'Authentication context missing.' });
  }

  try {
    const application = await Application.findByPk(appId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.userId !== req.user.id) {
      logger.warn(`User ${req.user.id} attempted unauthorized access to application ${appId}.`);
      return res.status(403).json({ message: 'Forbidden: You do not own this application.' });
    }

    req.application = application; // Attach application object to the request
    next();
  } catch (error) {
    logger.error(`Error in authorization for app ${appId} by user ${req.user.id}:`, error.message);
    res.status(500).json({ message: 'Server error during authorization.' });
  }
};

/**
 * Middleware to authenticate requests using an API Key, primarily for metric ingestion.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('Metric collection attempt without API key');
    return res.status(401).json({ message: 'API Key required for metric collection.' });
  }

  try {
    const { Application } = require('../models'); // Import here to avoid circular dependency
    const application = await Application.findOne({ where: { apiKey } });

    if (!application) {
      logger.warn(`Invalid API Key provided: ${apiKey}`);
      return res.status(403).json({ message: 'Invalid API Key.' });
    }

    req.application = application; // Attach application object to the request
    next();
  } catch (error) {
    logger.error('API Key authentication failed:', error.message);
    res.status(500).json({ message: 'Server error during API Key authentication.' });
  }
};


module.exports = {
  authenticateToken,
  authorizeApplicationOwner,
  authenticateApiKey,
};
```