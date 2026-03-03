import { BaseError } from './BaseError';

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}