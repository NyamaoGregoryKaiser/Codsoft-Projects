import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user';

const userService = new UserService();

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    // Ensure user can only access their own profile
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this user profile' });
    }
    const user = await userService.getUserById(userId);
    res.status(200).json(user);
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    // Ensure user can only update their own profile
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this user profile' });
    }
    const updatedUser = await userService.updateUser(userId, updates);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    // Ensure user can only delete their own profile
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this user profile' });
    }
    const result = await userService.deleteUser(userId);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};