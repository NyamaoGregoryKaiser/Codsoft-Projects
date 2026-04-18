import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class HttpException extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  let statusCode = 500;
  let message = 'Something went wrong!';

  if (error instanceof HttpException) {
    statusCode = error.statusCode;
    message = error.message;
  } else {
    // Log unexpected errors
    logger.error(`Unhandled Error: ${error.message}`, { stack: error.stack, originalError: error });
  }

  // Handle specific TypeORM errors (example)
  // if (error.name === 'QueryFailedError') {
  //   statusCode = 400; // Bad request for invalid queries
  //   message = 'Database query failed.';
  // }

  res.status(statusCode).json({
    status: statusCode.toString().startsWith('4') ? 'fail' : 'error',
    message,
    ...(config.app.nodeEnv === 'development' && { stack: error.stack }), // Only send stack in development
  });
};