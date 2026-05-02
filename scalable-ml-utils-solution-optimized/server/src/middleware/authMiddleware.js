const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');
const AppError = require('../utils/appError');
const { JWT_SECRET } = require('../config');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user to the request
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true },
      });

      if (!req.user) {
        throw new AppError('Not authorized, user not found', 401);
      }

      next();
    } catch (error) {
      next(new AppError('Not authorized, token failed', 401));
    }
  }

  if (!token) {
    next(new AppError('Not authorized, no token', 401));
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};