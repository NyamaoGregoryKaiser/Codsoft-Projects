import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Middleware to handle 404 Not Found errors
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

// Centralized error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  // If the error is not operational, use a generic message and log it
  if (!err.isOperational) {
    logger.error(`Non-operational error: ${err.stack || err.message}`);
    statusCode = 500;
    message = 'Internal Server Error';
  }

  // Log the error
  logger.error(`Status: ${statusCode}, Message: ${message}, Path: ${req.originalUrl}, Method: ${req.method}, Stack: ${err.stack}`);

  res.status(statusCode || 500).json({
    status: 'error',
    message: message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Only send stack in dev
  });
};