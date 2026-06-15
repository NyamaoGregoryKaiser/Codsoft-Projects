import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from './error.middleware';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const auth = (roles: UserRole[] = []) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new ApiError(403, 'Forbidden: You do not have the necessary permissions.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Authentication token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid authentication token'));
    } else {
      next(error);
    }
  }
};

export default auth;
```