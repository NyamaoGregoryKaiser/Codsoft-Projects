import { Request, Response, NextFunction } from 'express';
import { AppError } from '../error';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };

  // Log the error
  logger.error(error.message, { stack: error.stack, url: req.originalUrl, method: req.method, ip: req.ip });

  // Custom AppError
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma specific errors
    if (err.code === 'P2002') { // Unique constraint violation
      error = new AppError(`Duplicate field value: ${JSON.stringify(err.meta?.target)}. Please use another value.`, 400);
    } else if (err.code === 'P2025') { // Record not found
      error = new AppError(`Resource not found. ${err.meta?.cause}`, 404);
    } else {
      error = new AppError(`Database error: ${err.message}`, 500);
    }
  } else if (err instanceof SyntaxError && 'body' in err) {
    // JSON parsing error
    error = new AppError('Invalid JSON payload.', 400);
  } else {
    // Generic error fallback
    error = new AppError('Something went wrong!', 500);
  }

  res.status((error as AppError).statusCode || 500).json({
    status: 'error',
    message: (error as AppError).message || 'An unexpected error occurred',
    // In development, send full error details
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
    }),
  });
};