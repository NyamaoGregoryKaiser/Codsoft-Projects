```typescript
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../../middleware/errorHandler';

type RequestPart = 'body' | 'query' | 'params';

export const validate = (schema: Joi.ObjectSchema, property: RequestPart = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], { abortEarly: false, allowUnknown: true });
    if (error) {
      // Joi errors are caught by the general errorHandler
      // We attach them to req for the errorHandler to pick up
      (error as any).isJoi = true; // Mark as Joi error
      return next(error);
    }
    next();
  };
```