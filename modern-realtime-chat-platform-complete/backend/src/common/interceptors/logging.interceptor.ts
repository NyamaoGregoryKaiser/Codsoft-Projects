import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLogger } from '../logger/winston.logger';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLogger) {
    this.logger.setContext('LoggingInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query } = request;
    const now = Date.now();

    // Log incoming request details
    this.logger.log(`Incoming Request: ${method} ${url} - Query: ${JSON.stringify(query)} - Body: ${JSON.stringify(body)}`);

    return next
      .handle()
      .pipe(
        tap((data) => {
          // Log outgoing response details
          const responseTime = Date.now() - now;
          this.logger.log(`Outgoing Response: ${method} ${url} - Status: ${context.switchToHttp().getResponse().statusCode} - Time: ${responseTime}ms`);
          // Note: Logging full response data can be very verbose and potentially sensitive.
          // Consider logging only status or specific parts of the data.
          // Example: this.logger.debug(`Response Data: ${JSON.stringify(data).substring(0, 200)}...`);
        }),
      );
  }
}