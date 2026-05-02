```javascript
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = format;
const config = require('../config/env');

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    config.NODE_ENV === 'development' ? colorize() : json(),
    logFormat
  ),
  transports: [
    new transports.Console({
      handleExceptions: true
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ],
  exitOnError: false // Do not exit on handled exceptions
});

module.exports = logger;
```