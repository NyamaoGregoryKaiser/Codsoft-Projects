import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class CustomError extends Error {
  statusCode: number;
  data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    logger.error(`[${req.method}] ${req.path} - ${err.statusCode} - ${err.message}`, err.data);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data }),
    });
  }

  // Handle TypeORM specific errors if necessary
  if ((err as any).code && (err as any).code === '23505') { // PostgreSQL unique constraint violation
    logger.error(`[${req.method}] ${req.path} - 409 - Duplicate entry: ${err.message}`);
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected. Resource already exists.',
      error: err.message
    });
  }
  
  logger.error(`[${req.method}] ${req.path} - 500 - Unhandled Error: ${err.message}`, err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
};