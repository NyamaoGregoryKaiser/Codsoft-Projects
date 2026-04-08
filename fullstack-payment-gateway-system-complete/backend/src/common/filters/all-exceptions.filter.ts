import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppLogger } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly appLogger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message:
        typeof errorMessage === 'object' && 'message' in errorMessage
          ? (errorMessage as any).message
          : errorMessage,
      error: httpStatus === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : exception.constructor.name,
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.appLogger.error(`Unhandled exception: ${exception}`, (exception as Error).stack, AllExceptionsFilter.name);
    } else {
      this.appLogger.warn(`Handled HTTP exception (${httpStatus}): ${JSON.stringify(responseBody.message)} at ${responseBody.path}`, AllExceptionsFilter.name);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}