```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import config from '../config';
import prisma from '../database/prisma';
import { UserRole } from '@prisma/client';
import NodeCache from 'node-cache';
import { logger } from './logger';

// Extend the Request type to include user
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
  userId: string;
  email: string;
  role: UserRole;
}

// In-memory cache for user roles to reduce DB lookups for active users
const userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Cache for 5 minutes

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    let user = userCache.get<JwtPayload>(decoded.userId);

    if (!user) {
      // If not in cache, fetch from DB
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });

      if (!dbUser) {
        return next(new ApiError(401, 'User not found, token invalid'));
      }
      user = dbUser;
      userCache.set(user.id, user); // Cache the user
      logger.debug(`User ${user.email} cached.`);
    }

    req.user = user;
    next();
  } catch (error: any) {
    logger.error('JWT verification failed:', error.message);
    return next(new ApiError(401, 'Not authorized, token failed'));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `User role ${req.user?.role} is not authorized to access this route`));
    }
    next();
  };
};
```