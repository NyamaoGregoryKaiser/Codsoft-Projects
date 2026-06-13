```typescript
import { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/error';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error caught by global handler: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Include stack in dev
    error: err
  });

  if (res.headersSent) {
    return next(err); // Delegate to default error handler if headers already sent
  }

  const statusCode = err instanceof APIError ? err.statusCode : 500;
  const message = err instanceof APIError ? err.message : 'An unexpected error occurred';
  const errors = err instanceof APIError && err.errors ? err.errors : undefined;

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(errors && { errors: errors }),
  });
};
```