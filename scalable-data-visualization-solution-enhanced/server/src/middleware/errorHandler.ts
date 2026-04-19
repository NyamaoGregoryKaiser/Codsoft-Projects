```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { APIError } from '../utils/errors';
import { config } from '../config/config';

interface CustomError extends Error {
  statusCode?: number;
  data?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let data = err.data;

  // Log the error
  logger.error(`[Error] ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    statusCode: statusCode,
    data: err.data,
    requestId: (req as any).id, // If you have a request ID middleware
  });

  // Handle specific error types
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    data = err.errors.map(error => ({
      path: error.path.join('.'),
      message: error.message,
    }));
  } else if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
    data = err.data;
  } else if (err.name === 'UnauthorizedError') { // For express-jwt errors
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') { // For custom authorization errors
    statusCode = 403;
    message = 'Forbidden';
  }

  // Hide stack trace in production
  const errorResponse = {
    message,
    data,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};
```