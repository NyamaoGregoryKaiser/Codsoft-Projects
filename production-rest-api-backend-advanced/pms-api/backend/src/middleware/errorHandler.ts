import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../config/logger';
import config from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // If it's not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const apiError = error as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = apiError.message || 'Internal Server Error';

  // Log the error
  logger.error(
    `[${req.method} ${req.originalUrl}] Status: ${statusCode}, Message: ${message}, Stack: ${apiError.stack}`
  );

  res.status(statusCode).json({
    message: message,
    ...(config.env === 'development' && { stack: apiError.stack }), // Only send stack in dev
  });
};