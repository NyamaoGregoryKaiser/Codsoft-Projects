```typescript
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';
import { QueryFailedError } from 'typeorm';
import logger from '../utils/logger';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] | undefined;

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof QueryFailedError) {
    // Handle TypeORM query errors (e.g., unique constraint violations)
    statusCode = 400; // Bad Request
    if ((err as any).code === '23505') { // PostgreSQL unique_violation error code
      // Extract detail for unique constraint violation
      const detail = (err as any).detail;
      if (detail) {
        // Example: Key (email)=(test@example.com) already exists.
        const match = detail.match(/Key \((.+?)\)=\(.+?\) already exists/);
        if (match && match[1]) {
          message = `${match[1]} already exists.`;
        } else {
          message = 'Duplicate entry error.';
        }
      } else {
        message = 'Database unique constraint violation.';
      }
    } else {
      message = 'Database query failed.';
    }
    logger.error(`Database Query Failed: ${err.message}`, { stack: err.stack, req: { method: req.method, url: req.originalUrl } });
  } else {
    // Log unexpected errors
    logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack, req: { method: req.method, url: req.originalUrl } });
  }

  // Only send stack trace in development
  const errorResponse: { message: string; errors?: any[]; stack?: string } = { message };
  if (errors) {
    errorResponse.errors = errors;
  }
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
```