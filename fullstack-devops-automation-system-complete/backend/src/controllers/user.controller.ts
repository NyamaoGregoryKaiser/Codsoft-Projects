```typescript
import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { CustomError } from '../utils/errors';
import { UserRole } from '../types/enums';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.findAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      throw new CustomError('Invalid role specified', 400);
    }

    if (req.user && req.user.id === id) {
      throw new CustomError('Cannot change your own role', 400);
    }

    const updatedUser = await userService.updateUserRole(id, role);

    res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      throw new CustomError('Cannot delete yourself', 400);
    }

    await userService.deleteUser(id);
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};
```