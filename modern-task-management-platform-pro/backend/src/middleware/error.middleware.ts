```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import ApiResponse from '../utils/apiResponse';
import { config } from '../config/config';

// Global error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err } as AppError; // Copy error object to avoid modifying the original
  error.message = err.message;
  error.stack = err.stack; // Keep stack trace for debugging

  // Log error details
  if (config.nodeEnv === 'development') {
    logger.error('Error Details:', error);
  } else {
    logger.error('Production Error:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      isOperational: error.isOperational,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Handle specific types of errors
  if (error instanceof AppError) {
    // Custom operational error
    res.status(error.statusCode).json(ApiResponse.error(error.message, error.statusCode));
  } else if (error.name === 'CastError') {
    // Mongoose (or similar ORM) CastError for invalid IDs
    const message = `Resource not found with ID: ${error.value}`;
    res.status(404).json(ApiResponse.error(message, 404));
  } else if (error.name === 'ValidationError') {
    // Joi/Class-validator validation error (from a generic perspective)
    // For class-validator, errors are usually caught earlier by validation middleware
    const message = `Validation Error: ${error.message}`;
    res.status(400).json(ApiResponse.error(message, 400));
  } else if (error.code === '23505' && error.detail) { // PostgreSQL unique violation error code
    const match = error.detail.match(/\(.*?\) = \((.*?)\)/);
    const value = match ? match[1] : 'unknown value';
    const message = `Duplicate field value: ${value}. Please use another value.`;
    res.status(409).json(ApiResponse.error(message, 409));
  } else {
    // Generic server error
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Something went wrong!';

    res.status(statusCode).json(ApiResponse.error(message, statusCode));
  }
};

export default errorHandler;
```