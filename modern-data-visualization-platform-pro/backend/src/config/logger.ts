import { createLogger, format, transports } from 'winston';
import { NODE_ENV } from './env';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Global logger instance using Winston.
 * Configured for console output in development and structured logging in production.
 */
const logger = createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Include stack trace for errors
    logFormat
  ),
  transports: [
    // Console transport for all environments
    new transports.Console({
      format: combine(
        colorize(), // Colorize output for better readability in console
        logFormat
      ),
    }),
    // File transport for errors in production
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
      silent: NODE_ENV === 'development' || NODE_ENV === 'test', // Don't log to file in dev/test
    }),
    // File transport for all info level logs in production
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
      silent: NODE_ENV === 'development' || NODE_ENV === 'test', // Don't log to file in dev/test
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// For development, also log to console more verbosely
if (NODE_ENV === 'development') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      logFormat
    ),
  }));
}

export default logger;