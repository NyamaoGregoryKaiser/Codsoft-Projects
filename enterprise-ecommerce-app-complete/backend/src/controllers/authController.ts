```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '../utils/validators';
import { z } from 'zod';

type RegisterBody = z.infer<typeof registerSchema>['body'];
type LoginBody = z.infer<typeof loginSchema>['body'];

export const authController = {
  async register(req: Request<{}, {}, RegisterBody>, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.register(req.body);
      res.status(201).json({
        status: 'success',
        token,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.login(req.body);
      res.status(200).json({
        status: 'success',
        token,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  // Example: Get currently logged-in user profile
  async getMe(req: Request, res: Response, next: NextFunction) {
    // req.user is populated by the 'protect' middleware
    if (!req.user) {
      return next(new AppError('User not authenticated.', 401));
    }
    // In a real app, you might fetch more details from DB using req.user.id
    res.status(200).json({
      status: 'success',
      data: { user: req.user },
    });
  }
};
```