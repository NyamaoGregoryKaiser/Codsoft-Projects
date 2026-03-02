const winston = require('winston');
const config = require('../config');

// Define log levels and colors if needed
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'white',
  silly: 'gray',
};

winston.addColors(colors);

// Define the format for development environment
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.align(),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Define the format for production environment (JSON for structured logging)
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const logger = winston.createLogger({
  levels: levels,
  format: config.env === 'development' ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      level: config.env === 'development' ? 'debug' : 'info', // More verbose in dev, less in prod console
      handleExceptions: true,
    }),
    // Optionally, add file transports for production
    // new winston.transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   format: prodFormat,
    // }),
    // new winston.transports.File({
    //   filename: 'logs/combined.log',
    //   level: 'info',
    //   format: prodFormat,
    // }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
```

```