import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@config/env';
import { AppError } from '@utils/app-error';
import { AppDataSource } from '@db/data-source';
import { User } from '@models/User';
import logger from '@config/logger';

// Extend the Request object to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT.
 * It verifies the token from the Authorization header and attaches the user ID to the request.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;
    // Check if token is in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET!) as { id: string, iat: number, exp: number };

    // Find user by ID to ensure user still exists
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    // Attach user ID to the request object
    req.user = { id: user.id };
    next();
  } catch (err: any) {
    // If token is invalid or expired
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn(`Invalid JWT token: ${err.message}`);
      return next(new AppError('Invalid authentication token', 401));
    }
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn(`Expired JWT token: ${err.message}`);
      return next(new AppError('Authentication token has expired', 401));
    }
    logger.error('Error in authMiddleware:', err);
    next(err); // Pass other errors to the error handling middleware
  }
};