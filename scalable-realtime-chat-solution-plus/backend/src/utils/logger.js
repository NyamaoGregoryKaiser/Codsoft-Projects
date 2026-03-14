```javascript
/**
 * @file Configures and exports a Winston logger instance.
 * @module utils/logger
 */

const winston = require('winston');
const config = require('../config');

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
        enumerateErrorFormat(),
        config.env === 'development'
            ? winston.format.colorize()
            : winston.format.uncolorize(),
        winston.format.splat(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let logMessage = `${timestamp} - ${level}: ${message}`;
            if (Object.keys(meta).length) {
                // Remove redundant message from meta if it's already in the main message
                if (meta.message && meta.message === message) delete meta.message;
                // Stringify the remaining metadata
                logMessage += ` ${JSON.stringify(meta)}`;
            }
            return logMessage;
        })
    ),
    transports: [
        // Console transport for all environments
        new winston.transports.Console({
            stderrLevels: ['error'], // Send error logs to stderr
        }),
        // File transport for production/staging (example)
        ...(config.env !== 'development' ? [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
        ] : []),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
    exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
```