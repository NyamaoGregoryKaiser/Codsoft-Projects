import { Response, NextFunction } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import { ApiError } from './error.middleware';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest, UserRole } from '../types';
import prisma from '../config/database';

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED));
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'access') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired access token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'User not found for token'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED));
  }
};

export const authorize = (roles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action'));
    }
    next();
  };