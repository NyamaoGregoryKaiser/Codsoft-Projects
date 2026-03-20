import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';
import { CustomError } from '../types/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Invalid or expired token.';
  } else if (err.name === 'CastError' && (err as any).kind === 'ObjectId') { // For MongoDB, example
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid ID format.';
  }

  logger.error(`Error ${statusCode}: ${message}`, { stack: err.stack, path: req.path, method: req.method });

  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' && statusCode === StatusCodes.INTERNAL_SERVER_ERROR
      ? 'An unexpected error occurred.'
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};