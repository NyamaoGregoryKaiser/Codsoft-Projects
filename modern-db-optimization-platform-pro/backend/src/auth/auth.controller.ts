```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { z } from 'zod';
import { validate, passwordSchema } from '../shared/validation';

// Validation schema
const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    password: passwordSchema,
  }),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const { token, user } = await authService.login(username, password);
      res.status(200).json({ success: true, token, user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export const validateLogin = validate(loginSchema);
```