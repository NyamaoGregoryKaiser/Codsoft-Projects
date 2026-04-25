```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Task } from '../entities/Task';
import { Project } from '../entities/Project';
import { User } from '../entities/User';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler';
import { CreateTaskDto, UpdateTaskDto } from '../utils/validationSchemas';

export class TaskService {
  private taskRepository: Repository<Task>;
  private projectRepository: Repository<Project>;
  private userRepository: Repository<User>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.projectRepository = AppDataSource.getRepository(Project);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createTask(projectId: string, ownerId: string, taskData: CreateTaskDto): Promise<Task> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, owner: { id: ownerId } }, // Ensure project belongs to the user
    });

    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
    }

    let assignedTo: User | null = null;
    if (taskData.assignedToId) {
      assignedTo = await this.userRepository.findOneBy({ id: taskData.assignedToId });
      if (!assignedTo) {
        throw new BadRequestError(`User with ID ${taskData.assignedToId} not found.`);
      }
    }

    const newTask = this.taskRepository.create({
      ...taskData,
      project: project,
      assignedTo: assignedTo,
    });

    return this.taskRepository.save(newTask);
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    // Ownership check for the project should happen in the controller via auth middleware.
    // This service method just fetches tasks given a project ID.
    const tasks = await this.taskRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignedTo'],
      order: { createdAt: 'ASC' },
    });
    return tasks;
  }

  async getTaskById(taskId: string, ownerId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, project: { owner: { id: ownerId } } }, // Ensure task's project belongs to the user
      relations: ['project', 'assignedTo'],
    });

    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found or you don't have access.`);
    }
    return task;
  }

  async updateTask(taskId: string, ownerId: string, taskData: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, project: { owner: { id: ownerId } } },
      relations: ['assignedTo'],
    });

    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found or you don't have access.`);
    }

    let assignedTo: User | null = task.assignedTo;
    if (taskData.assignedToId !== undefined) {
      if (taskData.assignedToId === null) {
        assignedTo = null;
      } else {
        assignedTo = await this.userRepository.findOneBy({ id: taskData.assignedToId });
        if (!assignedTo) {
          throw new BadRequestError(`User with ID ${taskData.assignedToId} not found.`);
        }
      }
    }

    this.taskRepository.merge(task, { ...taskData, assignedTo });
    return this.taskRepository.save(task);
  }

  async deleteTask(taskId: string, ownerId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, project: { owner: { id: ownerId } } },
    });

    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found or you don't have access.`);
    }

    await this.taskRepository.remove(task);
  }
}
```