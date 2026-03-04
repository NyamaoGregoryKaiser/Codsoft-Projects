const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log stack trace for errors
    process.env.NODE_ENV === 'development' ? colorize() : json(), // Pretty print in dev, JSON in prod
    customFormat // Use custom format for console output
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ],
  exitOnError: false // Do not exit on handled exceptions
});

// For testing environment, suppress logs to avoid clutter
if (process.env.NODE_ENV === 'test') {
  logger.level = 'silent';
}

module.exports = logger;