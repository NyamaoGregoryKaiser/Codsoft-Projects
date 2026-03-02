import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/winston';

interface HttpError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  Logger.error(`Error: ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  Logger.error(err.stack);

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as HttpError;
  error.statusCode = 404;
  next(error);
};