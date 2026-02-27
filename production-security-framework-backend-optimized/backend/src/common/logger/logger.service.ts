```typescript
import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT }) // Transient scope creates a new instance for each consumer
export class LoggerService extends ConsoleLogger {
  private readonly logger: winston.Logger;

  constructor(context?: string) {
    super(context);
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        // Add file transport for production or specific environments
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(message: any, context?: string, ...optionalParams: any[]) {
    this.logger.info(message, { context: context || this.context, ...optionalParams });
    super.log(message, context); // Also log to console via Nest's default logger for development visibility
  }

  error(message: any, trace?: string, context?: string, ...optionalParams: any[]) {
    this.logger.error(message, { context: context || this.context, stack: trace, ...optionalParams });
    super.error(message, trace, context);
  }

  warn(message: any, context?: string, ...optionalParams: any[]) {
    this.logger.warn(message, { context: context || this.context, ...optionalParams });
    super.warn(message, context);
  }

  debug(message: any, context?: string, ...optionalParams: any[]) {
    this.logger.debug(message, { context: context || this.context, ...optionalParams });
    super.debug(message, context);
  }

  verbose(message: any, context?: string, ...optionalParams: any[]) {
    this.logger.verbose(message, { context: context || this.context, ...optionalParams });
    super.verbose(message, context);
  }
}
```