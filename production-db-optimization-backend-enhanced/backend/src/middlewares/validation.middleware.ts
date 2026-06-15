import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from './error.middleware';

// Reusable validation middleware
const validate = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }
  next();
};

export default validate;
```