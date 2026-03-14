```javascript
// server/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status-codes');
const config = require('../config');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const auth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true }, // Select essential user data
      });

      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found, invalid token');
      }

      next();
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, token failed');
    }
  }

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, no token');
  }
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, `User role ${req.user.role} is not authorized to access this resource`);
  }
  next();
};

module.exports = { auth, authorize };

```