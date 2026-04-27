import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from '../logger/winston.logger';

/**
 * Simple functional middleware for logging basic request information.
 * This demonstrates how to use a standard Express-style middleware in NestJS.
 * For more advanced logging with NestJS context, an interceptor might be preferred.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLogger) {
    this.logger.setContext('LoggerMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug(`[Express Middleware] ${req.method} ${req.originalUrl}`);
    next();
  }
}