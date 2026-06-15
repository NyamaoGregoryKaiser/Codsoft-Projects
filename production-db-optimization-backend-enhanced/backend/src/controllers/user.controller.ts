import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { ApiError } from '../middlewares/error.middleware';
import bcrypt from 'bcryptjs';

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await userService.getAllUsers(page, limit);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    // Omit password for security
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userService.createUser({ email, password: hashedPassword, firstName, lastName, role });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...updateData } = req.body;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await userService.updateUser(req.params.id, updateData);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
```