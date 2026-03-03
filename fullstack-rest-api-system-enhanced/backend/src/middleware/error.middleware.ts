import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../shared/errors';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof BaseError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle class-validator errors
    statusCode = 400;
    message = 'Validation Error';
    if ((err as any).errors) {
        message = (err as any).errors.map((e: any) => Object.values(e.constraints)).join(', ');
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, please log in again';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired, please log in again';
  }

  logger.error(`Error: ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack); // Log full stack trace for debugging

  res.status(statusCode).json({
    message: message,
    // In production, you might not want to send the full error details
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};