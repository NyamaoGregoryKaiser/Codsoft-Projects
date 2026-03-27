import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../modules/users/user.entity';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token missing or invalid format.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authentication token expired. Please log in again.'));
    }
    return next(new ApiError(401, 'Invalid authentication token.'));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'User not authenticated.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to access this resource.'));
    }
    next();
  };
};