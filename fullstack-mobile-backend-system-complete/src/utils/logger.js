```javascript
const winston = require('winston');
const config = require('../config');

// Define custom levels for logging (optional, default is fine)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define custom colors for logging levels (optional)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Set the logging level based on the environment
const level = () => {
  const env = config.env || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Create a Winston logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    // timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Errors will also show stack traces
    winston.format.errors({ stack: true }),
    // Format JSON for production, colorized simple text for development
    config.env === 'development'
      ? winston.format.combine(winston.format.colorize({ all: true }), winston.format.simple())
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Log to console in all environments
    // In production, also log to files
    ...(config.env === 'production'
      ? [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ]
      : []),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
```