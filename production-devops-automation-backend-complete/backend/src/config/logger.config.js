```javascript
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log the stack trace for errors
    json() // Use JSON format for structured logging, good for production
  ),
  transports: [
    // Console transport for development and general visibility
    new transports.Console({
      format: combine(
        colorize(), // Colorize output for better readability in console
        logFormat // Custom format for console output
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    }),
    // File transport for production (optional, can be replaced by cloud logging)
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
  exitOnError: false, // Do not exit on handled exceptions.
});

module.exports = logger;
```