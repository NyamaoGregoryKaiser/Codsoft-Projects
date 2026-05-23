import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { NODE_ENV } from '../config';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message} (Status: ${err.statusCode})`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  logger.error('Unhandled Error:', err);

  let errorMessage = 'Something went wrong!';
  if (NODE_ENV === 'development') {
    errorMessage = err.message; // More detailed error in development
  }

  res.status(500).json({
    status: 'error',
    message: errorMessage,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};