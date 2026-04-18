import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { BadRequestException } from '../middlewares/error.middleware';

export function validateRequest(dtoClass: ClassConstructor<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const output = plainToInstance(dtoClass, req.body);
    const errors = await validate(output, { skipMissingProperties: false });

    if (errors.length > 0) {
      const errorMessages = errors.map((error: ValidationError) => {
        return Object.values(error.constraints || {}).join(', ');
      }).join('; ');
      return next(new BadRequestException(`Validation failed: ${errorMessages}`));
    } else {
      req.body = output;
      next();
    }
  };
}