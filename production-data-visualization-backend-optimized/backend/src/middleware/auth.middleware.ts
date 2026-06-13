```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/jwt.config';
import { APIError } from '../utils/error';
import { db } from '../database/db';
import { UserRole } from '../models/User';
import logger from '../utils/logger';

// Extend the Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn(`Authentication failed: No token provided for ${req.method} ${req.originalUrl}`);
    return next(new APIError('Authentication token required', 401));
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      logger.warn(`Authentication failed: Invalid token for ${req.method} ${req.originalUrl}. Error: ${err.message}`);
      return next(new APIError('Invalid or expired token', 403));
    }

    req.user = user as JwtPayload;
    logger.debug(`User authenticated: ${req.user.email} (${req.user.role}) for ${req.method} ${req.originalUrl}`);
    next();
  });
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should ideally not happen if authenticateToken is run before
      logger.error('Authorization failed: No user found in request after authentication.');
      return next(new APIError('Unauthorized: User information missing', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User ${req.user.email} (role: ${req.user.role}) attempted to access restricted resource. Required roles: ${roles.join(', ')}`);
      return next(new APIError('Forbidden: You do not have the necessary permissions', 403));
    }
    logger.debug(`User authorized: ${req.user.email} (role: ${req.user.role}) for required roles: ${roles.join(', ')}`);
    next();
  };
};
```