import winston from 'winston';
import path from 'path';
import config from './index';

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level.toUpperCase()}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/rejections.log') }),
  ],
});

export default logger;