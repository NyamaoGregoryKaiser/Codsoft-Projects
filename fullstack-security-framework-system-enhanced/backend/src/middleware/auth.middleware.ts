import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { verifyAccessToken } from '@utils/jwt';
import { AppError } from '@utils/appError';
import { prisma } from '@models/prisma';
import { UserRoles, Role } from '@constants/roles';
import { AuthMessages } from '@constants/messages';
import { env } from '@config/env';

// Extend Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

/**
 * Authenticates user based on JWT access token from HttpOnly cookie.
 */
export const auth = () => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[env.jwtCookieNameAccess];

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.TOKEN_INVALID);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.USER_NOT_FOUND);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorizes user based on their role.
 * @param requiredRoles - Array of roles allowed to access the route.
 */
export const authorize = (requiredRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(httpStatus.UNAUTHORIZED, AuthMessages.UNAUTHORIZED));
  }

  if (!requiredRoles.includes(req.user.role)) {
    return next(new AppError(httpStatus.FORBIDDEN, AuthMessages.FORBIDDEN));
  }

  next();
};