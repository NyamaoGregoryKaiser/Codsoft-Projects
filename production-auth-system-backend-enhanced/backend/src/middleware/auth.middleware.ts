import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt.utils';
import { UserRole } from '../entities/User';
import { CustomError } from '../types/errors';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies (e.g., if using httpOnly cookies)
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new CustomError('Not authorized, no token', StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next(new CustomError('Not authorized, token failed', StatusCodes.UNAUTHORIZED));
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    next(new CustomError('Not authorized, token failed', StatusCodes.UNAUTHORIZED));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new CustomError(
          `User role ${req.user?.role} is not authorized to access this route. Required roles: ${roles.join(', ')}`,
          StatusCodes.FORBIDDEN
        )
      );
    }
    next();
  };
};