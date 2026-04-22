import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${JSON.stringify(body)} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`,
      context.getClass().name,
    );

    return next.handle().pipe(
      tap((data) => {
        this.logger.log(
          `Outgoing Response: ${method} ${url} - Status: ${context.switchToHttp().getResponse().statusCode} - Duration: ${Date.now() - now}ms`,
          context.getClass().name,
        );
      }),
    );
  }
}