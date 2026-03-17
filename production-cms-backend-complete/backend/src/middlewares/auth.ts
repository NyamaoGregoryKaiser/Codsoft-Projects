import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { CustomError } from './errorHandler';
import { UserRole } from '../entities/User';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Repository } from 'typeorm';

// Extend the Request type to include user information
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

const userRepository: Repository<User> = AppDataSource.getRepository(User);

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new CustomError(401, 'Not authorized to access this route. No token provided.'));
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new CustomError(401, 'Not authorized to access this route. Invalid token.'));
    }

    const user = await userRepository.findOneBy({ id: decoded.id });
    if (!user) {
      return next(new CustomError(401, 'User associated with token no longer exists.'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    return next(new CustomError(401, 'Not authorized to access this route.'));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new CustomError(403, `User role ${req.user?.role || 'unknown'} is not authorized to access this route. Required roles: ${roles.join(', ')}`));
    }
    next();
  };
};