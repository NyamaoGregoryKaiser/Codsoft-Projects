```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
import { config } from '../config';

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0]; // Extracts duplicated value
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError) => {
  let message: string;
  let statusCode: number;

  switch (err.code) {
    case 'P2002': // Unique constraint violation
      const target = (err.meta?.target as string[])?.join(', ') || 'field(s)';
      message = `Duplicate value for unique ${target}. Please use a different value.`;
      statusCode = 409;
      break;
    case 'P2025': // Record not found
      message = (err.meta?.cause as string) || 'Resource not found.';
      statusCode = 404;
      break;
    case 'P2003': // Foreign key constraint violation
      message = `Invalid foreign key. Linked resource does not exist.`;
      statusCode = 400;
      break;
    default:
      message = `Database operation failed: ${err.message}`;
      statusCode = 500;
  }
  return new AppError(message, statusCode);
};

const sendErrorDev = (err: AppError, res: Response) => {
  logger.error(err); // Log the full error in development
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err); // Log the original error for debugging

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (config.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message; // Ensure message is copied for production

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // Mongo specific, keep as example
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error instanceof Prisma.PrismaClientKnownRequestError) error = handlePrismaError(error);

    sendErrorProd(error, res);
  }
};
```