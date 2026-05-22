```typescript
import { Request, Response, NextFunction } from 'express';
import * as taskService from './task.service';
import ApiResponse from '../../utils/apiResponse';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { getPaginationOptions } from '../../utils/pagination';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const projectId = req.params.projectId;
    const createTaskDto: CreateTaskDto = req.body;
    const newTask = await taskService.createTask(projectId, createTaskDto, req.user.id);
    res.status(201).json(ApiResponse.success(newTask, 'Task created successfully', 201));
  } catch (error) {
    next(error);
  }
};

export const getTasksByProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const projectId = req.params.projectId;
    const paginationOptions = getPaginationOptions(req);
    const { tasks, total } = await taskService.findTasksByProject(projectId, req.user.id, paginationOptions);

    res.status(200).json(ApiResponse.success(tasks, 'Tasks fetched successfully', 200, {
      total,
      limit: paginationOptions.limit,
      page: paginationOptions.page,
      totalPages: Math.ceil(total / paginationOptions.limit),
    }));
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const taskId = req.params.taskId;
    const task = await taskService.findTaskById(taskId, req.user.id);
    res.status(200).json(ApiResponse.success(task, 'Task fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const taskId = req.params.taskId;
    const updateTaskDto: UpdateTaskDto = req.body;
    const updatedTask = await taskService.updateTask(taskId, updateTaskDto, req.user.id);
    res.status(200).json(ApiResponse.success(updatedTask, 'Task updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const taskId = req.params.taskId;
    await taskService.deleteTask(taskId, req.user.id);
    res.status(204).json(ApiResponse.success(null, 'Task deleted successfully'));
  } catch (error) {
    next(error);
  }
};
```