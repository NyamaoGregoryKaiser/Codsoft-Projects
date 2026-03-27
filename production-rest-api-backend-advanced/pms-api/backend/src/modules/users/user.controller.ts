import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './user.dtos';
import { ApiError } from '../../utils/apiError';

export class UserController {
  private userService = new UserService();

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createDto: CreateUserDto = req.body;
      if (!createDto.username || !createDto.email || !createDto.password || !createDto.role) {
        throw new ApiError(400, 'Username, email, password, and role are required.');
      }
      const newUser = await this.userService.createUser(createDto);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateDto: UpdateUserDto = req.body;
      if (Object.keys(updateDto).length === 0) {
        throw new ApiError(400, 'At least one field (username, email, password, or role) must be provided for update.');
      }
      const updatedUser = await this.userService.updateUser(req.params.id, updateDto);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.userService.deleteUser(req.params.id);
      res.status(204).send(); // No content for successful deletion
    } catch (error) {
      next(error);
    }
  };
}