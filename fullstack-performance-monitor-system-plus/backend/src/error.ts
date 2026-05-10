import { Request, Response, NextFunction } from 'express';
import { logger } from './utils/logger';

// Custom Error Class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype); // Fix for instance of check
  }
}

// Global unhandled promise rejection handler
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  // Log stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  // Application specific cleanup here (e.g., close DB connections)
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  process.exit(1);
});