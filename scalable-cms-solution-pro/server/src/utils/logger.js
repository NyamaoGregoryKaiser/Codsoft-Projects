```javascript
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;
const config = require('../config/config'); // Assuming config.js defines NODE_ENV

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
format.addColors(colors);

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ''}`;
});

const logger = createLogger({
  levels: logLevels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Errors should always include stack trace if available
    format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// If we're not in production, log to the console as well
if (config.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize({ all: true }),
      align(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`)
    ),
    level: 'debug', // Show debug logs in development console
  }));
}

module.exports = logger;
```