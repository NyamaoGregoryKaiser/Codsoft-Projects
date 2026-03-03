import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../../shared/interfaces/AuthRequest.interface';
import { UpdateUserDto } from './dtos/UpdateUser.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserRole } from '../../database/entities/User';
import { PaginationDto } from '../../shared/dtos/Pagination.dto';
import { redisClient } from '../../shared/utils/cache';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = plainToInstance(PaginationDto, req.query);
      const errors = await validate(queryParams);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      const cacheKey = `all_users_${JSON.stringify(queryParams)}`;
      const cachedUsers = await redisClient.get(cacheKey);

      if (cachedUsers) {
        return res.status(200).json(JSON.parse(cachedUsers));
      }

      const { users, total } = await this.usersService.findAllUsers(queryParams);
      await redisClient.set(cacheKey, JSON.stringify({ users, total }), { EX: 300 }); // Cache for 5 minutes
      res.status(200).json({ users, total });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.usersService.findUserById(id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateUserDto = plainToInstance(UpdateUserDto, req.body);
      const errors = await validate(updateUserDto);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      // A user can only update their own profile, unless they are an admin
      if (req.user!.id !== id && req.user!.role !== UserRole.ADMIN) {
        return next({ name: 'ForbiddenError', message: 'You are not authorized to update this user.' });
      }

      // Only admins can change user roles
      if (updateUserDto.role && req.user!.role !== UserRole.ADMIN) {
        return next({ name: 'ForbiddenError', message: 'You are not authorized to change user roles.' });
      }

      const updatedUser = await this.usersService.updateUser(id, updateUserDto);
      await redisClient.del('all_users_*'); // Invalidate all user caches
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // An admin cannot delete themselves
      if (req.user!.id === id && req.user!.role === UserRole.ADMIN) {
        return next({ name: 'ForbiddenError', message: 'Admin cannot delete their own account.' });
      }

      // Prevent non-admins from deleting any user
      if (req.user!.role !== UserRole.ADMIN) {
        return next({ name: 'ForbiddenError', message: 'Only administrators can delete users.' });
      }

      await this.usersService.deleteUser(id);
      await redisClient.del('all_users_*');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController(new UsersService());