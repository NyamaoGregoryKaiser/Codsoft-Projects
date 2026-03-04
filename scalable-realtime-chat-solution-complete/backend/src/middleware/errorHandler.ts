```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error ${statusCode}: ${message}`, err.stack);

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return res.status(statusCode).json({
      message: 'An unexpected error occurred. Please try again later.',
      success: false,
    });
  }

  // For development, send more detailed error info
  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    success: false,
  });
};
```