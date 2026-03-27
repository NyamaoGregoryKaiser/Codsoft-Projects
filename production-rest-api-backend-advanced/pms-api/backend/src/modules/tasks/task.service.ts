import { TaskRepository } from './task.repository';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './task.dtos';
import { ApiError } from '../../utils/apiError';
import logger from '../../config/logger';
import { AppDataSource } from '../../db/data-source';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { clearCache } from '../../middleware/cache';

export class TaskService {
  private taskRepository: TaskRepository;
  private projectRepository = AppDataSource.getRepository(Project);
  private userRepository = AppDataSource.getRepository(User);

  constructor(taskRepository: TaskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async getTasksByProjectId(projectId: string): Promise<TaskResponseDto[]> {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }
    const tasks = await this.taskRepository.findTasksByProjectId(projectId, ['project', 'assignedTo', 'createdBy']);
    return tasks.map(task => this.toTaskResponseDto(task));
  }

  async getTaskById(id: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findTaskById(id, ['project', 'assignedTo', 'createdBy']);
    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }
    return this.toTaskResponseDto(task);
  }

  async createTask(createDto: CreateTaskDto, creatorId: string): Promise<TaskResponseDto> {
    const project = await this.projectRepository.findOneBy({ id: createDto.projectId });
    if (!project) {
      throw new ApiError(404, 'Project not found for this task.');
    }

    if (createDto.assignedToId) {
      const assignedToUser = await this.userRepository.findOneBy({ id: createDto.assignedToId });
      if (!assignedToUser) {
        throw new ApiError(404, 'Assigned user not found.');
      }
    }

    const newTask = this.taskRepository.create({
      ...createDto,
      createdById: creatorId,
      project: project, // Assign the project entity
      assignedTo: createDto.assignedToId ? await this.userRepository.findOneBy({ id: createDto.assignedToId }) : undefined,
    });

    const savedTask = await this.taskRepository.save(newTask);
    clearCache(`/api/v1/projects/${createDto.projectId}/tasks`); // Invalidate tasks list cache
    logger.info(`Task created: "${savedTask.title}" in project ${savedTask.projectId} by user ${creatorId}`);
    return this.toTaskResponseDto(savedTask);
  }

  async updateTask(id: string, updateDto: UpdateTaskDto, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findTaskById(id, ['project', 'createdBy']);
    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    // Only project creator, task creator, or admin can update
    const userRole = await this.getUserRole(userId);
    if (task.project.createdById !== userId && task.createdById !== userId && userRole !== 'admin') {
      throw new ApiError(403, 'Forbidden: You do not have permission to update this task.');
    }

    if (updateDto.assignedToId !== undefined) {
      if (updateDto.assignedToId === null) {
        task.assignedTo = undefined; // Unassign
        task.assignedToId = undefined;
      } else {
        const assignedToUser = await this.userRepository.findOneBy({ id: updateDto.assignedToId });
        if (!assignedToUser) {
          throw new ApiError(404, 'Assigned user not found.');
        }
        task.assignedTo = assignedToUser;
        task.assignedToId = assignedToUser.id;
      }
    }

    Object.assign(task, { ...updateDto, assignedToId: undefined }); // Don't assign assignedToId directly if we handled assignedTo entity
    const updatedTask = await this.taskRepository.save(task);
    clearCache(`/api/v1/projects/${task.projectId}/tasks`); // Invalidate tasks list cache
    clearCache(`/api/v1/tasks/${id}`); // Invalidate specific task cache
    logger.info(`Task updated: "${updatedTask.title}" by user ${userId}`);
    return this.toTaskResponseDto(updatedTask);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findTaskById(id, ['project', 'createdBy']);
    if (!task) {
      throw new ApiError(404, 'Task not found.');
    }

    // Only project creator, task creator, or admin can delete
    const userRole = await this.getUserRole(userId);
    if (task.project.createdById !== userId && task.createdById !== userId && userRole !== 'admin') {
      throw new ApiError(403, 'Forbidden: You do not have permission to delete this task.');
    }

    const deleteResult = await this.taskRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new ApiError(404, 'Task not found (unexpected).');
    }
    clearCache(`/api/v1/projects/${task.projectId}/tasks`); // Invalidate tasks list cache
    clearCache(`/api/v1/tasks/${id}`); // Invalidate specific task cache
    logger.info(`Task deleted: ${id} by user ${userId}`);
  }

  private async getUserRole(userId: string): Promise<string | undefined> {
    const user = await this.userRepository.findOneBy({ id: userId });
    return user?.role;
  }

  private toTaskResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      projectName: task.project.name,
      assignedToId: task.assignedToId || undefined,
      assignedToUsername: task.assignedTo?.username || undefined,
      createdById: task.createdById,
      createdByUsername: task.createdBy.username,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}