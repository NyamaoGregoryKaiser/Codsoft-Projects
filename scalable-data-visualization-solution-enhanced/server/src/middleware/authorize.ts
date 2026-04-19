```typescript
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization: No user object found on request. Ensure protect middleware runs first.');
      return next(new APIError('Unauthorized access: No user context', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization: User ${req.user.id} with role ${req.user.role} attempted to access restricted resource. Required roles: ${roles.join(', ')}`);
      return next(new APIError('Forbidden: You do not have permission to perform this action', 403));
    }
    next();
  };
};
```