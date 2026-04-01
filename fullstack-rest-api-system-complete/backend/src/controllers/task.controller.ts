import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto } from '../validators/task.validator';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  public createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createData = plainToClass(CreateTaskDto, req.body);
      await validateOrReject(createData, { validationError: { target: false } });

      const userId = req.user!.id; // Task creator
      const task = await this.taskService.createTask(createData, userId);
      res.status(201).json(task);
    } catch (error) {
      logger.error(`TaskController - createTask failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public getTasksByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const tasks = await this.taskService.findTasksByProjectId(projectId);
      res.status(200).json(tasks);
    } catch (error) {
      logger.error(`TaskController - getTasksByProjectId failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.findTaskById(id);
      res.status(200).json(task);
    } catch (error) {
      logger.error(`TaskController - getTaskById failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = plainToClass(UpdateTaskDto, req.body);
      await validateOrReject(updateData, { validationError: { target: false } });

      const userId = req.user!.id;
      const updatedTask = await this.taskService.updateTask(id, updateData, userId);
      res.status(200).json(updatedTask);
    } catch (error) {
      logger.error(`TaskController - updateTask failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await this.taskService.deleteTask(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`TaskController - deleteTask failed: ${error.message}`, error.stack);
      next(error);
    }
  };
}