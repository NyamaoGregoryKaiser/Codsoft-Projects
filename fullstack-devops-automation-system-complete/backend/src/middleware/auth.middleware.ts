```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CustomError } from '../utils/errors';
import { UserRole } from '../types/enums';

// Extend the Request type to include the 'user' property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: UserRole };

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.id },
        select: ['id', 'email', 'role'], // Select only necessary fields
      });

      if (!user) {
        throw new CustomError('User not found or token invalid', 401);
      }

      req.user = user; // Attach user info to the request
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return next(new CustomError('Unauthorized: Invalid or expired token', 401));
      }
      next(new CustomError('Unauthorized: Not authorized to access this route', 401));
    }
  }

  if (!token) {
    next(new CustomError('Unauthorized: No token provided', 401));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should ideally not happen if 'protect' middleware is used before 'authorize'
      return next(new CustomError('Unauthorized: User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new CustomError(`Forbidden: ${req.user.role} access not allowed`, 403));
    }

    next();
  };
};
```