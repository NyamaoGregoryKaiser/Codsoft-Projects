import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';

export const validateBody = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = Object.assign(new dtoClass(), req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        if (error.constraints) {
          return Object.values(error.constraints);
        }
        return `Validation error on ${error.property}`;
      }).flat();
      logger.warn(`Validation error for ${req.path}: ${errorMessages.join(', ')}`);
      return next(new CustomError(400, 'Validation Failed', errorMessages));
    }
    req.body = dto; // Replace body with validated DTO instance
    next();
  };
};

export class CreateUserDto {
  email!: string;
  password!: string;
  role?: string; // Optional, handled by business logic defaults
}

export class LoginUserDto {
  email!: string;
  password!: string;
}

export class CreateCategoryDto {
  name!: string;
  description?: string;
}

export class UpdateCategoryDto {
  name?: string;
  description?: string;
}

export class CreateContentDto {
  title!: string;
  body!: string;
  categoryId!: string;
  thumbnailUrl?: string;
  status?: string;
  isFeatured?: boolean;
}

export class UpdateContentDto {
  title?: string;
  body?: string;
  categoryId?: string;
  thumbnailUrl?: string;
  status?: string;
  isFeatured?: boolean;
}