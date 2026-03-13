```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from './http-error';
import { UserRole } from './enums';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new HttpError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      username: string;
      role: UserRole;
    };
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    return next(new HttpError('Not authorized, token failed', 401));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError('Not authorized to access this route', 403));
    }
    next();
  };
};
```