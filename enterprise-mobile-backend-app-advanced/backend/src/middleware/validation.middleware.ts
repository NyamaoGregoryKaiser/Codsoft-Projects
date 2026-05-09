import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ApiError } from './error.middleware';
import { StatusCodes } from 'http-status-codes';

const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      // The error handler middleware will catch ZodError specifically
      next(error);
    }
  };

export default validate;