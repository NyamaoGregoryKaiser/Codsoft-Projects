```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TaskService } from '../services/TaskService';
import { createTaskSchema, updateTaskSchema } from '../utils/validationSchemas';
import { ForbiddenError } from '../middlewares/errorHandler';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const taskData = createTaskSchema.parse(req.body);
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for task creation.');
      }
      const task = await this.taskService.createTask(projectId, req.user.id, taskData);
      res.status(StatusCodes.CREATED).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getTasksByProjectId(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for fetching tasks.');
      }
      // The authorizeOwner middleware for project already ensures user owns the project
      // So no need to recheck ownerId here, just use projectId.
      const tasks = await this.taskService.getTasksByProjectId(projectId);
      res.status(StatusCodes.OK).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      // The `authorizeOwner` middleware for task already fetches and validates ownership,
      // and attaches the resource to `req.resource`.
      const task = (req as any).resource;
      res.status(StatusCodes.OK).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const taskData = updateTaskSchema.parse(req.body);
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for task update.');
      }
      const updatedTask = await this.taskService.updateTask(id, req.user.id, taskData);
      res.status(StatusCodes.OK).json(updatedTask);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!req.user?.id) {
        throw new ForbiddenError('User not authenticated for task deletion.');
      }
      await this.taskService.deleteTask(id, req.user.id);
      res.status(StatusCodes.OK).json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
```