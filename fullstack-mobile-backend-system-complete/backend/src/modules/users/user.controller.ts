import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { updateUserSchema, userIdSchema } from './user.validation';
import { ApiError } from '../../middleware/errorHandler';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const user = await userService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const validatedData = updateUserSchema.parse(req.body);

    // Ensure regular users can only update their own profile and not change their role
    if (req.user?.role === 'USER' && req.user.id !== id) {
      throw new ApiError(403, 'You can only update your own profile.');
    }
    if (req.user?.role === 'USER' && validatedData.role) {
      throw new ApiError(403, 'You are not allowed to change your role.');
    }

    const updatedUser = await userService.updateUserDetails(id, validatedData, req.user!.role);
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    // Admins can delete any user. Regular users cannot delete themselves or others.
    if (req.user?.role === 'USER') {
        throw new ApiError(403, 'Users are not allowed to delete accounts.');
    }

    const result = await userService.deleteUser(id);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};