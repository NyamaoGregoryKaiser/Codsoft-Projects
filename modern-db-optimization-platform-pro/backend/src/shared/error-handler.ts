```typescript
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './http-error';
import logger from './logger';
import { config } from '../config';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new HttpError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
}

export function errorHandler(
  err: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'An unexpected error occurred.';
  let errors: string[] | undefined;

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof Error) {
    // For general operational errors or unhandled system errors
    logger.error(`Unhandled error: ${err.message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      user: req.user?.id,
    });
    // In production, avoid sending detailed error messages for unhandled errors
    if (config.isProduction) {
      message = 'Internal Server Error';
    } else {
      message = err.message; // During development, show actual error
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || (config.isDevelopment ? [err.stack || 'No stack trace'] : undefined),
  });
}
```