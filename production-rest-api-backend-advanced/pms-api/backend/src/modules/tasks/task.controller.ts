import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dtos';
import { ApiError } from '../../utils/apiError';

export class TaskController {
  private taskService = new TaskService();

  getTasksByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.taskService.getTasksByProjectId(req.params.projectId);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  };

  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.getTaskById(req.params.id);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createDto: CreateTaskDto = req.body;
      createDto.projectId = req.params.projectId; // Ensure projectId from URL path is used
      if (!createDto.title || !createDto.projectId) {
        throw new ApiError(400, 'Task title and projectId are required.');
      }
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to create task.');
      }
      const newTask = await this.taskService.createTask(createDto, req.user.id);
      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateDto: UpdateTaskDto = req.body;
      if (Object.keys(updateDto).length === 0) {
        throw new ApiError(400, 'At least one field (title, description, status, priority, assignedToId) must be provided for update.');
      }
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to update task.');
      }
      const updatedTask = await this.taskService.updateTask(req.params.id, updateDto, req.user.id);
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'User not authenticated to delete task.');
      }
      await this.taskService.deleteTask(req.params.id, req.user.id);
      res.status(204).send(); // No content for successful deletion
    } catch (error) {
      next(error);
    }
  };
}