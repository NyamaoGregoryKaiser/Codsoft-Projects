import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { QueryFailedError } from 'typeorm';
import ApiError from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof QueryFailedError
        ? StatusCodes.BAD_REQUEST
        : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || StatusCodes[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;
  if (!err.isOperational) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (env.NODE_ENV === 'development') {
    logger.error(err);
  } else {
    logger.error(`Error ${statusCode}: ${message}`);
  }

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };