const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new Error('You are not logged in! Please log in to get access.', { cause: 401 }));
  }

  try {
    const decoded = await verifyToken(token);
    const currentUser = await User.findByPk(decoded.id);

    if (!currentUser) {
      return next(new Error('The user belonging to this token no longer exists.', { cause: 401 }));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    logger.error(`JWT Verification Error: ${err.message}`);
    return next(new Error('Invalid token. Please log in again.', { cause: 401 }));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new Error('You do not have permission to perform this action', { cause: 403 }));
    }
    next();
  };
};

module.exports = { protect, authorize };