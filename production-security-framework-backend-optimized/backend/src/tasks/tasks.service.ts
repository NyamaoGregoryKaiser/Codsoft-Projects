```typescript
import { Injectable, NotFoundException, ConflictException, CACHE_MANAGER, Inject } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { LoggerService } from '../common/logger/logger.service';
import { Cache } from 'cache-manager';

@Injectable()
export class TasksService {
  private readonly TASK_CACHE_KEY_PREFIX = 'task:';

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
    const project = await this.projectsService.findOne(createTaskDto.projectId); // This also checks project existence
    // Ensure the creator has access to the project
    if (project.owner.id !== creatorId) {
      // This is an additional check, as ProjectOwnerGuard already handles it for controller access.
      // But good to have in service for direct calls or future refactoring.
      throw new NotFoundException(`Project with ID "${createTaskDto.projectId}" not found or you don't own it.`);
    }

    const assignee = createTaskDto.assigneeId
      ? await this.usersService.findById(createTaskDto.assigneeId)
      : null;

    const task = this.tasksRepository.create({
      ...createTaskDto,
      project: project,
      assignee: assignee,
      creator: { id: creatorId },
    });
    await this.tasksRepository.save(task);
    this.logger.log(`Task created: ${task.id} for project ${project.id} by user ${creatorId}`, TasksService.name);
    // Invalidate cache for tasks list related to this project
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + `project:${project.id}`);
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + 'all'); // If there's a global task list cache
    return task;
  }

  async findAll(projectId?: string): Promise<Task[]> {
    const cacheKey = projectId ? this.TASK_CACHE_KEY_PREFIX + `project:${projectId}` : this.TASK_CACHE_KEY_PREFIX + 'all';
    const cachedTasks = await this.cacheManager.get<Task[]>(cacheKey);
    if (cachedTasks) {
      this.logger.debug(`Returning tasks for project ${projectId || 'all'} from cache`, TasksService.name);
      return cachedTasks;
    }

    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator');

    if (projectId) {
      query.where('task.projectId = :projectId', { projectId });
    }
    const tasks = await query.getMany();
    await this.cacheManager.set(cacheKey, tasks, { ttl: 60 }); // Cache for 60 seconds
    this.logger.log(`Returning tasks for project ${projectId || 'all'} from database`, TasksService.name);
    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    const cachedTask = await this.cacheManager.get<Task>(this.TASK_CACHE_KEY_PREFIX + id);
    if (cachedTask) {
      this.logger.debug(`Returning task ${id} from cache`, TasksService.name);
      return cachedTask;
    }

    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'creator'],
    });
    if (!task) {
      this.logger.warn(`Task not found: ${id}`, TasksService.name);
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    await this.cacheManager.set(this.TASK_CACHE_KEY_PREFIX + id, task, { ttl: 300 }); // Cache for 5 minutes
    this.logger.log(`Returning task ${id} from database`, TasksService.name);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id); // Throws NotFoundException if not found

    // If project is being updated, validate existence
    if (updateTaskDto.projectId && updateTaskDto.projectId !== task.project.id) {
      const newProject = await this.projectsService.findOne(updateTaskDto.projectId);
      task.project = newProject;
    }

    // If assignee is being updated, validate existence
    if (updateTaskDto.assigneeId) {
      const newAssignee = await this.usersService.findById(updateTaskDto.assigneeId);
      task.assignee = newAssignee;
    } else if (updateTaskDto.assigneeId === null) { // Allow unassigning
      task.assignee = null;
    }

    // Update fields
    Object.assign(task, updateTaskDto);
    await this.tasksRepository.save(task);
    this.logger.log(`Task updated: ${id}`, TasksService.name);
    // Invalidate caches
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + 'all');
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + `project:${task.project.id}`);
    return task;
  }

  async remove(id: string): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project'], // Load project to invalidate cache
    });
    if (!task) {
      this.logger.warn(`Task deletion failed: ID ${id} not found.`, TasksService.name);
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }

    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Task deletion failed after initial find: ID ${id} not deleted.`, TasksService.name);
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    this.logger.log(`Task deleted: ${id}`, TasksService.name);
    // Invalidate caches
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + 'all');
    await this.cacheManager.del(this.TASK_CACHE_KEY_PREFIX + `project:${task.project.id}`);
  }
}
```