const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align, json } = format;

// Define custom log levels (optional, Winston default levels are: error, warn, info, http, verbose, debug, silly)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5,
};

// Custom format for console output
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`)
);

// Custom format for file output (JSON for structured logging)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
);

const logger = createLogger({
  levels: levels,
  defaultMeta: { service: 'cms-backend' },
  transports: [
    // Console transport for development and production
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: consoleFormat,
      handleExceptions: true, // Catch and log uncaught exceptions
    }),
    // File transport for errors (all environments)
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
      handleExceptions: true,
    }),
    // File transport for combined logs (all environments)
    new transports.File({
      filename: 'logs/combined.log',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions, Winston will keep process alive
});

// For HTTP logging (used by morgan)
logger.stream = {
  write: (message) => {
    logger.http(message);
  },
};

module.exports = logger;
```