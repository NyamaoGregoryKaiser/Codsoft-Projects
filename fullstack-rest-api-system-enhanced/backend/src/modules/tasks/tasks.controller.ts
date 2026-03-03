import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service';
import { AuthRequest } from '../../shared/interfaces/AuthRequest.interface';
import { CreateTaskDto } from './dtos/CreateTask.dto';
import { UpdateTaskDto } from './dtos/UpdateTask.dto';
import { TaskQueryParamsDto } from './dtos/TaskQueryParams.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserRole } from '../../database/entities/User';
import { AppDataSource } from '../../database';
import { Task } from '../../database/entities/Task';
import { redisClient } from '../../shared/utils/cache';

export class TasksController {
  constructor(private tasksService: TasksService) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createTaskDto = plainToInstance(CreateTaskDto, req.body);
      const errors = await validate(createTaskDto);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      // If assigneeId is provided by a non-admin, ensure it's their own ID
      if (createTaskDto.assigneeId && req.user!.role !== UserRole.ADMIN && createTaskDto.assigneeId !== req.user!.id) {
        return next({ name: 'ForbiddenError', message: 'You can only assign tasks to yourself.' });
      }
      // If no assigneeId is provided, default to the current user's ID
      if (!createTaskDto.assigneeId) {
        createTaskDto.assigneeId = req.user!.id;
      }

      const task = await this.tasksService.createTask(createTaskDto);
      // Invalidate cache for tasks list
      await redisClient.del('all_tasks');
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queryParams = plainToInstance(TaskQueryParamsDto, req.query);
      const errors = await validate(queryParams);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      const cacheKey = `tasks_user_${req.user!.id}_${JSON.stringify(queryParams)}`;
      const cachedTasks = await redisClient.get(cacheKey);

      if (cachedTasks) {
        return res.status(200).json(JSON.parse(cachedTasks));
      }

      // For non-admin users, filter by their own assigneeId
      if (req.user!.role !== UserRole.ADMIN) {
        queryParams.assigneeId = req.user!.id;
      }

      const { tasks, total } = await this.tasksService.findAllTasks(queryParams);
      await redisClient.set(cacheKey, JSON.stringify({ tasks, total }), { EX: 60 }); // Cache for 60 seconds
      res.status(200).json({ tasks, total });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await this.tasksService.findTaskById(id);

      if (req.user!.role !== UserRole.ADMIN && task.assigneeId !== req.user!.id) {
        return next({ name: 'ForbiddenError', message: 'You are not authorized to view this task.' });
      }

      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateTaskDto = plainToInstance(UpdateTaskDto, req.body);
      const errors = await validate(updateTaskDto);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      const existingTask = await AppDataSource.getRepository(Task).findOne({ where: { id } });
      if (!existingTask) {
        return next({ name: 'NotFoundError', message: `Task with ID ${id} not found` });
      }

      // Non-admin users can only update their own tasks (except for admin-specific fields)
      if (req.user!.role !== UserRole.ADMIN && existingTask.assigneeId !== req.user!.id) {
        return next({ name: 'ForbiddenError', message: 'You are not authorized to update this task.' });
      }

      // If a non-admin tries to change assigneeId or status to a forbidden status
      if (req.user!.role !== UserRole.ADMIN) {
        if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== req.user!.id) {
            return next({ name: 'ForbiddenError', message: 'You cannot change the assignee of a task.' });
        }
        // Only allow status change to specific values for non-admins if needed, otherwise block it
        // For example, if users can only mark tasks as COMPLETED
        // if (updateTaskDto.status && ![TaskStatus.COMPLETED, TaskStatus.PENDING].includes(updateTaskDto.status)) {
        //   return next({ name: 'ForbiddenError', message: 'You cannot change task status to this value.' });
        // }
      }

      const updatedTask = await this.tasksService.updateTask(id, updateTaskDto);
      // Invalidate cache for this task and tasks list
      await redisClient.del(`tasks_user_${req.user!.id}_*`); // Clear all task caches for this user
      await redisClient.del('all_tasks');
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existingTask = await AppDataSource.getRepository(Task).findOne({ where: { id } });
      if (!existingTask) {
        return next({ name: 'NotFoundError', message: `Task with ID ${id} not found` });
      }

      // Only allow admin or the task assignee to delete a task
      if (req.user!.role !== UserRole.ADMIN && existingTask.assigneeId !== req.user!.id) {
        return next({ name: 'ForbiddenError', message: 'You are not authorized to delete this task.' });
      }

      await this.tasksService.deleteTask(id);
      // Invalidate cache
      await redisClient.del(`tasks_user_${req.user!.id}_*`);
      await redisClient.del('all_tasks');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController(new TasksService());