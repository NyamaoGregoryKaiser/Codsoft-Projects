import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';

@Injectable({ scope: Scope.TRANSIENT }) // Transient scope ensures a new instance per request/module
export class AppLogger extends ConsoleLogger {
  private readonly logger: winston.Logger;

  constructor() {
    super(); // Call the base class constructor
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(), // JSON format for structured logging
      ),
      transports: [
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(info => `${info.timestamp} ${info.level}: [${info.context}] ${info.message} ${info.stack ? info.stack : ''}`),
          ),
        }),
        // Add file transports for production
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
    });
  }

  log(message: any, context?: string): void {
    const finalContext = context || this.context;
    this.logger.info({ message, context: finalContext });
  }

  error(message: any, trace?: string, context?: string): void {
    const finalContext = context || this.context;
    this.logger.error({ message, context: finalContext, stack: trace });
  }

  warn(message: any, context?: string): void {
    const finalContext = context || this.context;
    this.logger.warn({ message, context: finalContext });
  }

  debug(message: any, context?: string): void {
    const finalContext = context || this.context;
    this.logger.debug({ message, context: finalContext });
  }

  verbose(message: any, context?: string): void {
    const finalContext = context || this.context;
    this.logger.verbose({ message, context: finalContext });
  }
}