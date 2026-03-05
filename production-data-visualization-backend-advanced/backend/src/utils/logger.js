const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const config = require('../config/config');

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: combine(
    colorize({ all: true }), // For console output
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log stack trace for errors
    logFormat
  ),
  transports: [
    new transports.Console(),
    // Uncomment for file logging in production
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'combined.log' }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;