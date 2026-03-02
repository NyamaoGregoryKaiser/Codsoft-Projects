const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { UserService } = require('../services'); // Assuming UserService can fetch user by ID

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token missing or invalid format'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    // Attach user information to the request object
    // For simplicity, we just attach userId from token.
    // In a real app, you might fetch the full user from DB to ensure it's still valid
    // and up-to-date, potentially checking roles/permissions.
    req.user = { id: decoded.sub };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token expired'));
    }
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authentication token'));
  }
};

module.exports = auth;
```

```