import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { UnauthorizedException, ForbiddenException, HttpException } from './error.middleware';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import logger from '../config/logger';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.id }, relations: ['role'] });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpException) {
      return next(error);
    }
    logger.error('Authentication error:', error);
    next(new UnauthorizedException('Invalid or expired token.'));
  }
};

export const authorize = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required.'));
    }

    if (!req.user.role || !requiredRoles.includes(req.user.role.name)) {
      return next(new ForbiddenException('Access denied. You do not have the required permissions.'));
    }

    next();
  };
};