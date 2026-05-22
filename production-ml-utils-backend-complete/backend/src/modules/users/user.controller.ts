```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AppError } from '../../utils/appError';
import * as yup from 'yup';

const userService = new UserService();

// Schema for user creation/update validation
const userSchema = yup.object().shape({
  name: yup.string().min(3).max(255).required(),
  email: yup.string().email().required(),
  password: yup.string().min(8).max(255).optional(), // Optional for update
  role: yup.string().oneOf(['user', 'admin']).optional(),
});

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = await userSchema.validate(req.body, { abortEarly: false });
    const user = await userService.createUser(userData);
    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    if (error instanceof yup.ValidationError) {
      return next(new AppError(error.errors.join(', '), 400));
    }
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = await userSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    // Prevent role escalation by non-admins or changing own role directly without proper admin logic
    if (userData.role && req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
        return next(new AppError('You are not authorized to change user roles.', 403));
    }
    const user = await userService.updateUser(req.params.id, userData);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    if (error instanceof yup.ValidationError) {
      return next(new AppError(error.errors.join(', '), 400));
    }
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};
```