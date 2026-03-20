import { StatusCodes } from 'http-status-codes';

export class CustomError extends Error {
  statusCode: StatusCodes;

  constructor(message: string, statusCode: StatusCodes) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class BadRequestError extends CustomError {
  constructor(message = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Not Found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ValidationError extends BadRequestError {
  constructor(message = 'Validation Error') {
    super(message);
  }
}