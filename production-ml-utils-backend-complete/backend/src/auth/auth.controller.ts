```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AppError } from '../utils/appError';
import { authRateLimiter } from '../middleware/rateLimiter';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.register(name, email, password, role);
    const token = authService.createToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = [
  authRateLimiter, // Apply rate limiting to login attempts
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
      }

      const user = await authService.login(email, password);
      const token = authService.createToken(user.id);

      res.status(200).json({
        status: 'success',
        token,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
];
```