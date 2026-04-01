import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';
import { config } from '../config';

export const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  logger.error(
    `[ERROR] Status: ${status} - Message: ${message} - Path: ${req.path} - Method: ${req.method}`,
    error.stack
  );

  res.status(status).json({
    status,
    message,
    // Include stack trace only in development environment
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  });
};