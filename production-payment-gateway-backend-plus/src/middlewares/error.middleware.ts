```typescript
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api.error";
import logger from "../config/logger";
import config from "../config";

// Handle 404 Not Found errors
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  // If it's not an operational error, hide internal details in production
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = config.NODE_ENV === "production" ? "Internal Server Error" : error.message;
    error = new ApiError(statusCode, message, false, error.stack);
  }

  // Log the error
  logger.error(
    `[${error.statusCode}] ${error.message}`,
    {
      path: req.originalUrl,
      method: req.method,
      stack: error.stack,
      isOperational: error.isOperational,
    }
  );

  res.status(error.statusCode).json({
    message: error.message,
    status: error.statusCode,
    timestamp: new Date().toISOString(),
    ...(config.NODE_ENV === "development" && { stack: error.stack }), // Include stack in dev
  });
};
```