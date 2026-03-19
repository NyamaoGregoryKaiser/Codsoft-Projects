import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppDataSource } from '../database';
import { User, UserRole } from '../database/entities/User.entity';
import ApiError from '../utils/ApiError';
import { verifyToken } from '../utils/jwt.utils';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    req.user = user; // Attach user object to the request
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (requiredRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required for authorization'));
    }

    if (!requiredRoles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden: Insufficient permissions'));
    }

    next();
  };