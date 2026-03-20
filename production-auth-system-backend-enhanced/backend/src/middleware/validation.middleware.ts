import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from '../types/errors';

export function validationMiddleware<T>(type: new () => T, skipMissingProperties = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const object = plainToInstance(type, req.body);
    const errors = await validate(object as object, { skipMissingProperties });

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        const constraints = error.constraints || {};
        return Object.values(constraints).join(', ');
      }).join('; ');
      next(new ValidationError(`Validation failed: ${messages}`));
    } else {
      req.body = object; // Replace req.body with the validated and transformed DTO instance
      next();
    }
  };
}