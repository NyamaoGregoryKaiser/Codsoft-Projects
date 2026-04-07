```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../db');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Authentication token missing');
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, config.jwt.secret);

  const currentUser = await db.User.findByPk(decoded.id);
  if (!currentUser) {
    logger.warn(`User with ID ${decoded.id} from token no longer exists.`);
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  req.user = currentUser;
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} tried to access unauthorized resource (requires: ${roles.join(', ')})`);
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const restrictToOwner = (modelName, foreignKey = 'owner_id') => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const Model = db[modelName];

    if (!Model) {
      logger.error(`restrictToOwner: Model ${modelName} not found in DB.`);
      return next(new AppError('Internal server error: Model configuration missing.', 500));
    }

    const resource = await Model.findByPk(id);

    if (!resource) {
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    }

    if (resource[foreignKey] !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} tried to modify/delete ${modelName} ${id} (owned by ${resource[foreignKey]}) without permission.`);
      return next(new AppError(`You do not have permission to modify this ${modelName}.`, 403));
    }

    next();
  });
};

module.exports = { protect, authorize, restrictToOwner };
```