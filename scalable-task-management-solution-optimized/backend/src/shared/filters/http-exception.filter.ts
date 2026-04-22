import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppLogger } from '../logger/app-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLogger
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof errorResponse === 'object'
        ? (errorResponse as any).message || errorResponse
        : errorResponse;

    const errorStack = (exception as any).stack;

    // Log the error
    this.logger.error(
      `HTTP Error: ${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(errorMessage)}`,
      errorStack,
      'HttpExceptionFilter'
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      // Include stack only in development for debugging
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
}