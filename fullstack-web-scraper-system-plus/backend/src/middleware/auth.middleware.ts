import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserRole } from '../types/enums';
import { AppError } from '../utils/appError';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication failed: No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Authentication failed: Token expired', 401);
    }
    throw new AppError('Authentication failed: Invalid token', 401);
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This case should theoretically not happen if `authenticate` runs before `authorize`
      throw new AppError('Authorization failed: User not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Authorization failed: Insufficient permissions', 403);
    }
    next();
  };
};