```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch() // Catch all unhandled exceptions
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the error
    this.logger.error(
      `HTTP Status: ${status} | Path: ${request.url} | Method: ${request.method}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      AllExceptionsFilter.name,
      {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        status,
        message: typeof message === 'object' ? message['message'] || message : message,
        // Optionally, include user ID if authenticated
        // userId: request.user?.id,
      },
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? message['message'] || message : message,
      // In production, avoid sending detailed error messages to clients for security
      // unless specifically designed for API consumers.
      // For validation errors, the 'message' from HttpException.getResponse() can be an array of strings
      // e.g., { "statusCode": 400, "message": ["email must be an email"], "error": "Bad Request" }
    });
  }
}
```