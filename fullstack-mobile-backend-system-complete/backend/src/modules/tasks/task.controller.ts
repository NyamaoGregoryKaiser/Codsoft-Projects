import { Request, Response, NextFunction } from 'express';
import * as taskService from './task.service';
import { createTaskSchema, updateTaskSchema, taskIdSchema } from './task.validation';
import { ApiError } from '../../middleware/errorHandler';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(validatedData, req.user!.id);
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getTasks(req.user!.id, req.user!.role);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = taskIdSchema.parse(req.params);
    const task = await taskService.getTaskById(id, req.user!.id, req.user!.role);
    res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = taskIdSchema.parse(req.params);
    const validatedData = updateTaskSchema.parse(req.body);
    const updatedTask = await taskService.updateTask(id, validatedData, req.user!.id, req.user!.role);
    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = taskIdSchema.parse(req.params);
    const result = await taskService.deleteTask(id, req.user!.id, req.user!.role);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};