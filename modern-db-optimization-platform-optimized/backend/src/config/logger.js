const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;
const config = require('./index');

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        // new transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new transports.File({ filename: 'logs/combined.log' }),
    ],
    exceptionHandlers: [
        new transports.Console(),
        // new transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
        new transports.Console(),
        // new transports.File({ filename: 'logs/rejections.log' })
    ],
});

module.exports = logger;