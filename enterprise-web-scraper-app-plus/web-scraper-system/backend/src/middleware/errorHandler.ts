```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import ApiResponse from '../lib/ApiResponse';

// Custom error for API
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

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  // If it's not an operational error, send a generic message
  if (!(err instanceof ApiError) || err.isOperational === false) {
    statusCode = 500;
    message = 'Internal Server Error';
    logger.error(`Non-operational error: ${err.message}`, { stack: err.stack, path: req.path });
  } else {
    logger.warn(`Operational error: ${err.message}`, { statusCode, path: req.path });
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = 'Validation Error';
    const errors = err.details.map((detail: any) => detail.message);
    return res.status(statusCode).json(ApiResponse.error(errors, message, statusCode));
  }

  // Handle Prisma errors (e.g., unique constraint violation)
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400; // Bad Request for most Prisma client errors
    message = 'Database Error';
    if (err.code === 'P2002') { // Unique constraint failed
      message = `${err.meta?.target || 'Field'} already exists.`;
    }
    logger.error(`Prisma error: ${err.message} (Code: ${err.code})`, { path: req.path });
    return res.status(statusCode).json(ApiResponse.error(message, 'Database Error', statusCode));
  }

  res.status(statusCode).json(ApiResponse.error(message, message, statusCode));
};
```