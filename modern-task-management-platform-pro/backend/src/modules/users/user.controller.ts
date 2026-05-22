```typescript
import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import ApiResponse from '../../utils/apiResponse';
import { getPaginationOptions } from '../../utils/pagination';
import { UpdateUserDto, UpdateUserRoleDto } from './user.dto';

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paginationOptions = getPaginationOptions(req);
    const { users, total } = await userService.findAllUsers(paginationOptions);

    res.status(200).json(ApiResponse.success(users, 'Users fetched successfully', 200, {
      total,
      limit: paginationOptions.limit,
      page: paginationOptions.page,
      totalPages: Math.ceil(total / paginationOptions.limit),
    }));
  } catch (error) {
    next(error);
  }
};

// Get user by ID (Admin or owner)
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const user = await userService.findUserById(userId);
    res.status(200).json(ApiResponse.success(user, 'User fetched successfully'));
  } catch (error) {
    next(error);
  }
};

// Update a user's own profile
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const updateData: UpdateUserDto = req.body;
    const updatedUser = await userService.updateUserProfile(req.user.id, updateData);
    res.status(200).json(ApiResponse.success(updatedUser, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Update any user's profile (Admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const updateData: UpdateUserDto = req.body;
    const updatedUser = await userService.updateUserProfile(userId, updateData);
    res.status(200).json(ApiResponse.success(updatedUser, 'User updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Update a user's role (Admin only)
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const { role }: UpdateUserRoleDto = req.body;
    const updatedUser = await userService.updateUserRole(userId, role);
    res.status(200).json(ApiResponse.success(updatedUser, 'User role updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete a user (Admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    res.status(204).json(ApiResponse.success(null, 'User deleted successfully')); // 204 No Content
  } catch (error) {
    next(error);
  }
};
```