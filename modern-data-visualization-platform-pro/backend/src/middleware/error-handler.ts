import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';
import { NODE_ENV } from '@config/env';
import { QueryFailedError } from 'typeorm';

/**
 * Global error handling middleware for Express.
 * It catches all errors thrown in the application and sends a standardized error response.
 * @param err - The error object.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err }; // Create a copy of the error object
  error.message = err.message; // Ensure message is copied

  // Log the error
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  if (err instanceof AppError) {
    // Custom operational errors
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else if (err instanceof QueryFailedError) {
    // TypeORM QueryFailedError (e.g., unique constraint violation, foreign key error)
    const dbError = err as any; // Cast to any to access driver-specific properties
    let message = 'Database operation failed.';
    let statusCode = 500;

    // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
    if (dbError.code === '23505') { // unique_violation
      message = 'Duplicate entry detected. This resource already exists.';
      statusCode = 400;
    } else if (dbError.code === '23503') { // foreign_key_violation
      message = 'Referenced resource not found or cannot be deleted due to dependencies.';
      statusCode = 400;
    } else if (dbError.code === '22P02') { // invalid_text_representation (e.g., invalid UUID)
      message = 'Invalid data format provided.';
      statusCode = 400;
    } else {
      message = `Database error: ${dbError.detail || dbError.message}`;
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: message,
    });
  } else {
    // Other unexpected errors (e.g., programming errors)
    const statusCode = 500;
    const message = 'Something went wrong on the server.';

    // In development, send full error details for debugging
    if (NODE_ENV === 'development') {
      res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: err.stack,
        error: err,
      });
    } else {
      // In production, send a generic message
      res.status(statusCode).json({
        success: false,
        message: message,
      });
    }
  }
};