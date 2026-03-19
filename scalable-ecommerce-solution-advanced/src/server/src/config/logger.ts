import winston from 'winston';
import { env, LOG_LEVEL, LOG_DIR } from './env';
import path from 'path';

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  logFormat
);

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: env.NODE_ENV === 'development' ? developmentFormat : productionFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

export { logger };