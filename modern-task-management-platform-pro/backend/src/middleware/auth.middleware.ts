```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/user.entity';
import { config } from '../config/config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new UnauthorizedError('No token provided. Please log in to get access.'));
  }

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; iat: number; exp: number };

    // 2. Find user by ID from token
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOneBy({ id: decoded.id });

    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // 3. Attach user to request object
    req.user = currentUser;
    next();
  } catch (error: any) {
    logger.error('Authentication failed:', error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token. Please log in again.'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired. Please log in again.'));
    }
    next(new UnauthorizedError('Authentication failed.'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated.')); // Should ideally be caught by 'protect'
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }
    next();
  };
};
```