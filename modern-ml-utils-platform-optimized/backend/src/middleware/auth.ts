import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import ApiError from '../shared/errors/ApiError';
import catchAsync from '../shared/utils/catchAsync';
import config from '../config';
import AppDataSource from '../database/datasource';
import { User } from '../modules/users/entities/User';

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, no token'));
  }

  try {
    const decoded: any = jwt.verify(token, config.jwt.secret);
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      select: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'] // Exclude password
    });

    if (!user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, user not found'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, token failed'));
  }
});

// Example for future roles if needed
// export const authorize = (...roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden, you do not have permission to access this resource'));
//     }
//     next();
//   };
// };