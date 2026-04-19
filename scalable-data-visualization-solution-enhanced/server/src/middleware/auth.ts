```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend the Request object to include user information
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Auth: No token provided');
    return next(new APIError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      logger.warn(`Auth: User not found for decoded ID: ${decoded.id}`);
      return next(new APIError('Not authorized, user not found', 401));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error: any) {
    logger.error(`Auth: Token verification failed: ${error.message}`, { error });
    if (error.name === 'TokenExpiredError') {
      return next(new APIError('Token expired', 401));
    }
    return next(new APIError('Not authorized, token failed', 401));
  }
};
```