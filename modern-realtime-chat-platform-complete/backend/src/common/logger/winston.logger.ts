import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // For daily file rotation

/**
 * Custom logger service using Winston.
 * Implements NestJS's LoggerService interface for seamless integration.
 * Supports multiple transports (console, file, daily rotate file).
 */
@Injectable({ scope: Scope.TRANSIENT }) // Transient scope allows setting context per instance
export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const logsDir = this.configService.get<string>('LOGS_DIR', 'logs');

    // Define custom log format
    const logFormat = winston.format.printf(({ level, message, timestamp, context, stack }) => {
      return `${timestamp} [${context || 'NestJS'}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
    });

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Include stack trace
        winston.format.splat(), // For string interpolation
        logFormat,
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }), // Colorize console output
            logFormat,
          ),
        }),
        // Daily rotating file transport
        new winston.transports.DailyRotateFile({
          filename: `${logsDir}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true, // Compress old log files
          maxSize: '20m', // Max size of a log file
          maxFiles: '14d', // Retain logs for 14 days
          level: logLevel,
        }),
        // Error file transport (only logs errors)
        new winston.transports.DailyRotateFile({
          filename: `${logsDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
        }),
      ],
      exceptionHandlers: [
        new winston.transports.DailyRotateFile({
          filename: `${logsDir}/exceptions-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
      rejectionHandlers: [
        new winston.transports.DailyRotateFile({
          filename: `${logsDir}/rejections-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, ...optionalParams: any[]) {
    this.logger.info(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  error(message: string, trace?: string, ...optionalParams: any[]) {
    this.logger.error(message, { context: this.context, stack: trace, ...this.extractMetadata(optionalParams) });
  }

  warn(message: string, ...optionalParams: any[]) {
    this.logger.warn(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  debug(message: string, ...optionalParams: any[]) {
    this.logger.debug(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  verbose(message: string, ...optionalParams: any[]) {
    this.logger.verbose(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  private extractMetadata(optionalParams: any[]): Record<string, any> {
    if (optionalParams.length > 0 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null) {
      return optionalParams[0]; // Assume the first optional param is a metadata object
    }
    return {};
  }
}