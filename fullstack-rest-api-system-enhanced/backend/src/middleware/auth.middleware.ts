import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/index';
import { verifyToken } from '../shared/utils/jwt';
import { AppDataSource } from '../database';
import { User, UserRole } from '../database/entities/User';
import { AuthRequest } from '../shared/interfaces/AuthRequest.interface';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        throw new UnauthorizedError('Not authorized, user not found');
      }

      req.user = user;
      next();
    } catch (error) {
      next(new UnauthorizedError('Not authorized, token failed'));
    }
  }

  if (!token) {
    next(new UnauthorizedError('Not authorized, no token'));
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Not authorized to access this route'));
    }
    next();
  };
};