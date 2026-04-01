import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../validators/user.validator';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.findAllUsers();
      res.status(200).json(users);
    } catch (error) {
      logger.error(`UserController - getAllUsers failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.findUserById(id);
      res.status(200).json(user);
    } catch (error) {
      logger.error(`UserController - getUserById failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Authenticated user ID
      const updateData = plainToClass(UpdateUserDto, req.body);
      await validateOrReject(updateData, { validationError: { target: false } });

      const updatedUser = await this.userService.updateUser(userId, updateData);
      res.status(200).json(updatedUser);
    } catch (error) {
      logger.error(`UserController - updateProfile failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // User ID to update (admin privilege)
      const updateData = plainToClass(UpdateUserDto, req.body);
      await validateOrReject(updateData, { validationError: { target: false } });

      const updatedUser = await this.userService.updateUser(id, updateData);
      res.status(200).json(updatedUser);
    } catch (error) {
      logger.error(`UserController - updateUser failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      res.status(204).send(); // No Content
    } catch (error) {
      logger.error(`UserController - deleteUser failed: ${error.message}`, error.stack);
      next(error);
    }
  };
}