import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { WinstonLogger } from '../logger/winston.logger';
import { Request, Response } from 'express';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Catch() // Catches all exceptions
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly logger: WinstonLogger) {
    super(); // Call the constructor of the base class
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const isHttp = host.getType() === 'http';
    const isWs = host.getType() === 'ws';

    // Default error response
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        errorName = (response as any).error || errorName;
      }
    } else if (exception instanceof WsException) {
      status = HttpStatus.BAD_REQUEST; // WsExceptions typically indicate bad input or unauthorized
      message = exception.message;
      errorName = 'WebSocketError';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      error: errorName,
    };

    if (isHttp) {
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      errorResponse['path'] = request.url;
      errorResponse['method'] = request.method;

      // Log the error
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`HTTP Error: ${request.method} ${request.url} - ${message}`, (exception as Error).stack || 'No Stack', errorResponse);
      } else {
        this.logger.warn(`HTTP Warning: ${request.method} ${request.url} - ${message}`, errorResponse);
      }

      response.status(status).json(errorResponse);
    } else if (isWs) {
      // WebSocket exception handling
      const client = ctx.switchToWs().getClient<Socket>();
      // WebSocket errors are typically sent back to the client that caused the issue
      client.emit('exception', errorResponse);
      this.logger.error(`WS Error: Client ${client.id} - ${message}`, (exception as Error).stack || 'No Stack', errorResponse);
    } else {
      // For other types of contexts, fallback to default NestJS exception handling
      this.logger.error(`Unhandled Context Error: ${message}`, (exception as Error).stack || 'No Stack', { context: host.getType() });
      super.catch(exception, host); // Fallback to NestJS default if context is neither HTTP nor WS
    }
  }
}