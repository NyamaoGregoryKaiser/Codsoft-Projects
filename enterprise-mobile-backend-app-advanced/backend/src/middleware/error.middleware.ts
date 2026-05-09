import { Request, Response, NextFunction } from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import logger from '../config/logger';
import config from '../config/env';
import { ZodError } from 'zod';

export class ApiError extends Error {
  public statusCode: StatusCodes;
  public isOperational: boolean;

  constructor(statusCode: StatusCodes, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation Error';
    const errors = err.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message,
    }));
    return res.status(statusCode).json({
      success: false,
      error: {
        code: ReasonPhrases.BAD_REQUEST,
        message,
        details: errors,
      },
    });
  }

  if (!(err instanceof ApiError)) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = ReasonPhrases.INTERNAL_SERVER_ERROR;
  }

  const response = {
    success: false,
    error: {
      code: ReasonPhrases[statusCode] || 'UNKNOWN_ERROR',
      message: message || ReasonPhrases.INTERNAL_SERVER_ERROR,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  logger.error(err);

  res.status(statusCode).json(response);
};

export default errorHandler;