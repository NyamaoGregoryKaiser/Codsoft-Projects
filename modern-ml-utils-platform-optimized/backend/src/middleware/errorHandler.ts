import { Request, Response, NextFunction } from 'express';
import ApiError from '../shared/errors/ApiError';
import httpStatus from 'http-status';
import logger from '../config/logger';
import config from '../config';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  } else {
    logger.error(err.message);
  }

  res.status(statusCode).send(response);
};

export default errorHandler;