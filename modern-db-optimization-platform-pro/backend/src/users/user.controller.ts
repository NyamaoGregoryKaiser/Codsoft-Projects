```typescript
import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { HttpError } from '../shared/http-error';
import { UserRole } from '../shared/enums';
import { z } from 'zod';
import { validate, passwordSchema } from '../shared/validation';

// Validation schemas
const registerUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    password: passwordSchema,
    role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
  }),
});

export class UserController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, role } = req.body;
      const user = await userService.createUser(username, password, role);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const user = await userService.findById(req.user.id);
      if (!user) {
        return next(new HttpError('User not found', 404));
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
export const validateRegisterUser = validate(registerUserSchema);
```