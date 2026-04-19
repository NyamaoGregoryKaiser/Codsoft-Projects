```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken } = await authService.login(req.body);
      res.status(200).json({ message: 'Logged in successfully', accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = await authService.refreshToken(req.body);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new APIError('User not authenticated', 401));
      }
      const { password, ...userWithoutPassword } = req.user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }
};
```