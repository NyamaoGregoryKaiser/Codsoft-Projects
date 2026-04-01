import { AppDataSource } from '../config/database';
import { Task } from '../models/Task.entity';
import { Project } from '../models/Project.entity';
import { User } from '../models/User.entity';
import { CreateTaskDto, UpdateTaskDto } from '../validators/task.validator';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';
import { clearCache } from '../middleware/cache.middleware';

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private projectRepository = AppDataSource.getRepository(Project);
  private userRepository = AppDataSource.getRepository(User);

  public async createTask(taskData: CreateTaskDto, userId: string) {
    try {
      const project = await this.projectRepository.findOne({ where: { id: taskData.projectId }, relations: ['owner'] });
      if (!project) {
        throw new HttpException(404, `Project with ID ${taskData.projectId} not found.`);
      }
      // Only project owner can create tasks for their project
      if (project.owner.id !== userId) {
        throw new HttpException(403, 'Forbidden: You do not have permission to create tasks for this project.');
      }

      let assignee: User | undefined;
      if (taskData.assigneeId) {
        assignee = await this.userRepository.findOneBy({ id: taskData.assigneeId });
        if (!assignee) {
          throw new HttpException(404, `Assignee with ID ${taskData.assigneeId} not found.`);
        }
      }

      const task = this.taskRepository.create({
        ...taskData,
        project,
        assignee,
      });

      await this.taskRepository.save(task);
      await clearCache(`/api/projects/${taskData.projectId}`); // Clear project detail cache

      logger.info(`Task created: ${task.id} in project ${taskData.projectId}`);
      return task;
    } catch (error) {
      logger.error(`TaskService - createTask failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to create task.');
    }
  }

  public async findTasksByProjectId(projectId: string) {
    try {
      const tasks = await this.taskRepository.find({
        where: { projectId },
        relations: ['assignee'],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          dueDate: 'ASC',
          priority: 'DESC',
        }
      });
      return tasks;
    } catch (error) {
      logger.error(`TaskService - findTasksByProjectId failed: ${error.message}`, error.stack);
      throw new HttpException(500, 'Failed to retrieve tasks for project.');
    }
  }

  public async findTaskById(id: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['project', 'assignee', 'comments', 'comments.user'],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          project: {
            id: true,
            name: true,
            ownerId: true,
          },
          assignee: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          comments: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (!task) {
        throw new HttpException(404, `Task with ID ${id} not found.`);
      }
      return task;
    } catch (error) {
      logger.error(`TaskService - findTaskById failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to retrieve task.');
    }
  }

  public async updateTask(taskId: string, updateData: UpdateTaskDto, userId: string) {
    try {
      const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project', 'project.owner'] });
      if (!task) {
        throw new HttpException(404, `Task with ID ${taskId} not found.`);
      }

      // Authorization: Only project owner or assigned user can update a task (status, priority, etc)
      // Only project owner can change assignee
      if (task.project.owner.id !== userId && task.assigneeId !== userId) {
        throw new HttpException(403, 'Forbidden: You do not have permission to update this task.');
      }

      if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
        if (task.project.owner.id !== userId) {
          throw new HttpException(403, 'Forbidden: Only the project owner can change task assignee.');
        }
        const newAssignee = await this.userRepository.findOneBy({ id: updateData.assigneeId });
        if (!newAssignee) {
          throw new HttpException(404, `Assignee with ID ${updateData.assigneeId} not found.`);
        }
        task.assignee = newAssignee;
        task.assigneeId = newAssignee.id;
      }

      Object.assign(task, updateData);
      await this.taskRepository.save(task);
      await clearCache(`/api/tasks/${taskId}`); // Clear specific task cache
      await clearCache(`/api/projects/${task.projectId}`); // Clear project detail cache

      logger.info(`Task updated: ${task.id} by user ${userId}`);
      return task;
    } catch (error) {
      logger.error(`TaskService - updateTask failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to update task.');
    }
  }

  public async deleteTask(taskId: string, userId: string) {
    try {
      const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project', 'project.owner'] });
      if (!task) {
        throw new HttpException(404, `Task with ID ${taskId} not found.`);
      }

      // Authorization: Only project owner can delete a task
      if (task.project.owner.id !== userId) {
        throw new HttpException(403, 'Forbidden: You do not have permission to delete this task.');
      }

      await this.taskRepository.delete(taskId);
      await clearCache(`/api/tasks/${taskId}`); // Clear specific task cache
      await clearCache(`/api/projects/${task.projectId}`); // Clear project detail cache

      logger.info(`Task deleted: ${taskId} by user ${userId}`);
    } catch (error) {
      logger.error(`TaskService - deleteTask failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to delete task.');
    }
  }
}