import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from './index';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.app.nodeEnv === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(metadata).length) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.DailyRotateFile({
      level: 'info',
      filename: `${config.log.dir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Maximum file size of the log file
      maxFiles: '14d', // Delete files older than 14 days
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: `${config.log.dir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
  exitOnError: false,
});

export default logger;