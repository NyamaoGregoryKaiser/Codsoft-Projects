```typescript
import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

// Helper function to format validation errors
const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => {
    if (error.constraints) {
      return Object.values(error.constraints).join(', ');
    }
    // Handle nested errors if any
    if (error.children && error.children.length > 0) {
      return `${error.property}: ${formatValidationErrors(error.children)}`;
    }
    return '';
  }).filter(Boolean).join('; ');
};

// Middleware to validate request body against a DTO
export const validateBody = (dtoClass: any) => {
  return async (req: Request, res: NextFunction, next: NextFunction) => {
    const output = plainToInstance(dtoClass, req.body);
    const errors = await validate(output, { skipMissingProperties: false });

    if (errors.length > 0) {
      const errorMessage = formatValidationErrors(errors);
      logger.warn(`Validation failed for ${req.path}: ${errorMessage}`);
      return next(new BadRequestError(errorMessage));
    }
    // If validation passes, assign the transformed object back to req.body
    // This ensures consistency and proper typing for subsequent layers
    req.body = output;
    next();
  };
};

// Middleware to validate request parameters against a DTO (e.g., for UUIDs)
export const validateParams = (dtoClass: any) => {
  return async (req: Request, res: NextFunction, next: NextFunction) => {
    const output = plainToInstance(dtoClass, req.params);
    const errors = await validate(output, { skipMissingProperties: false });

    if (errors.length > 0) {
      const errorMessage = formatValidationErrors(errors);
      logger.warn(`Validation failed for parameters on ${req.path}: ${errorMessage}`);
      return next(new BadRequestError(errorMessage));
    }
    next();
  };
};

// Middleware to validate request queries against a DTO
export const validateQuery = (dtoClass: any) => {
  return async (req: Request, res: NextFunction, next: NextFunction) => {
    const output = plainToInstance(dtoClass, req.query);
    const errors = await validate(output, { skipMissingProperties: false, whitelist: true, forbidNonWhitelisted: true });

    if (errors.length > 0) {
      const errorMessage = formatValidationErrors(errors);
      logger.warn(`Validation failed for query on ${req.path}: ${errorMessage}`);
      return next(new BadRequestError(errorMessage));
    }
    req.query = output as any; // Cast back to any as plainToInstance might change types slightly
    next();
  };
};
```