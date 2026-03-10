import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { AppError } from '@utils/appError';
import { logger } from '@utils/logger';
import { env } from '@config/env';
import { ErrorResponse } from '@utils/response';
import { GenericMessages } from '@constants/messages';

/**
 * Catches all errors and sends a standardized error response.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || GenericMessages.INTERNAL_SERVER_ERROR;

  // If the error is not an operational error (AppError), convert it to one
  if (!(err instanceof AppError)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = GenericMessages.INTERNAL_SERVER_ERROR;
    // For non-operational errors, log the stack trace only in dev
    if (env.isDevelopment) {
      logger.error('Non-operational error:', err);
    }
  }

  // If in production, do not leak stack trace or sensitive error details
  const response = {
    code: statusCode,
    message: message,
    ...(env.isDevelopment && { stack: err.stack }),
  };

  if (env.isDevelopment) {
    logger.error(`Error ${statusCode}: ${message}`);
  }

  new ErrorResponse(statusCode, message, env.isDevelopment ? err.stack : undefined).send(res);
};