import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { AppError } from '@utils/appError';
import { GenericMessages } from '@constants/messages';

/**
 * Handles requests to undefined routes, returning a 404 Not Found error.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(httpStatus.NOT_FOUND, GenericMessages.NOT_FOUND));
};