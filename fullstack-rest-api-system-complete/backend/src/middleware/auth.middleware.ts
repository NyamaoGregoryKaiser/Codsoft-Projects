import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { HttpException } from '../utils/http-exception';
import { UserRole } from '../models/User.entity';

export const authMiddleware = (roles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new HttpException(401, 'No token provided or invalid format.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next(new HttpException(401, 'Invalid or expired token.'));
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };

    // Check for role-based authorization
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      return next(new HttpException(403, 'Forbidden: Insufficient permissions.'));
    }

    next();
  };
};