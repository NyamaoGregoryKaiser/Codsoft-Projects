```javascript
const { createLogger, format, transports } = require('winston');
const path = require('path');
const config = require('../config/config');

const { combine, timestamp, label, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, label, timestamp, stack }) => {
    return `${timestamp} [${label}] ${level}: ${stack || message}`;
});

const logger = createLogger({
    level: config.logLevel, // e.g., 'info', 'debug', 'warn', 'error'
    format: combine(
        errors({ stack: true }), // <-- This is important for logging stack traces
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        label({ label: 'CMS_BACKEND' }),
        logFormat
    ),
    transports: [
        new transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        }),
        new transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, '../../logs/combined.log') })
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join(__dirname, '../../logs/exceptions.log') })
    ],
    rejectionHandlers: [
        new transports.File({ filename: path.join(__dirname, '../../logs/rejections.log') })
    ]
});

// Create a stream object with a 'write' function that Winston can use
// for morgan middleware (HTTP request logging)
logger.stream = {
    write: (message) => {
        logger.info(message.trim()); // Morgan adds newline by default
    },
};

module.exports = logger;
```