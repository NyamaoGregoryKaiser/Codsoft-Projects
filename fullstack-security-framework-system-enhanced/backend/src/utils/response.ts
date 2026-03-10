import { Response } from 'express';
import httpStatus from 'http-status';

interface ApiResponse {
  code: number;
  message: string;
  data?: any;
  stack?: string; // Only for development error responses
}

/**
 * Base class for API responses.
 */
abstract class BaseResponse {
  protected code: number;
  protected message: string;
  protected data?: any;
  protected stack?: string;

  constructor(code: number, message: string, data?: any, stack?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.stack = stack;
  }

  abstract send(res: Response): void;
}

/**
 * Represents a successful API response.
 */
export class SuccessResponse extends BaseResponse {
  constructor(code: number, message: string, data?: any) {
    super(code, message, data);
  }

  send(res: Response): void {
    const response: ApiResponse = {
      code: this.code,
      message: this.message,
      ...(this.data && { data: this.data }),
    };
    res.status(this.code).json(response);
  }
}

/**
 * Represents an error API response.
 */
export class ErrorResponse extends BaseResponse {
  constructor(code: number, message: string, stack?: string) {
    super(code, message, undefined, stack);
  }

  send(res: Response): void {
    const response: ApiResponse = {
      code: this.code,
      message: this.message,
      ...(this.stack && { stack: this.stack }),
    };
    res.status(this.code).json(response);
  }
}