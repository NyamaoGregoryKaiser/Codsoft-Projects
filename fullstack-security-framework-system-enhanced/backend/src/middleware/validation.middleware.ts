import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '@utils/appError';
import { GenericMessages } from '@constants/messages';

/**
 * Middleware for validating request body, params, or query using Zod schemas.
 * @param schema - Zod schema object with properties for body, params, and/or query.
 */
export const validate = (schema: { body?: AnyZodObject; params?: AnyZodObject; query?: AnyZodObject }) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for better readability
        const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new AppError(httpStatus.BAD_REQUEST, `${GenericMessages.BAD_REQUEST} ${errorMessage}`));
      }
      next(error);
    }
  };