const { createLogger, format, transports } = require('winston');
const config = require('@config');

const { combine, timestamp, printf, colorize, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: config.logLevel,
  formats: combine(
    errors({ stack: true }), // Log the stack trace for errors
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json() // Use JSON format for production logs
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// If we're not in production then log to the `console` with a simpler format.
if (config.env !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      logFormat
    ),
  }));
}

module.exports = logger;