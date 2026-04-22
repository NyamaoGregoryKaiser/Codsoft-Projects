import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from './dto/task.dto';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TagsService } from '../tags/tags.service';
import { AppLogger } from '../shared/logger/app-logger.service';
import { TaskStatus } from '../shared/enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private tagsService: TagsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TasksService.name);
  }

  async create(createTaskDto: CreateTaskDto, currentUserId: string): Promise<Task> {
    const { projectId, assigneeId, tagIds, ...taskDetails } = createTaskDto;

    // 1. Validate Project Ownership
    const project = await this.projectsService.findOne(projectId, currentUserId); // Will throw NotFound or Forbidden
    if (!project) {
      throw new BadRequestException(`Project with ID ${projectId} not found or not accessible.`);
    }

    // 2. Validate Assignee (if provided)
    let assignee = null;
    if (assigneeId) {
      assignee = await this.usersService.findById(assigneeId);
      if (!assignee) {
        throw new BadRequestException(`Assignee with ID ${assigneeId} not found.`);
      }
    }

    // 3. Validate and Link Tags (if provided)
    let tags = [];
    if (tagIds && tagIds.length > 0) {
      tags = await this.tagsService.findManyByIds(tagIds);
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('One or more provided tag IDs are invalid.');
      }
    }

    const task = this.tasksRepository.create({
      ...taskDetails,
      projectId: project.id,
      project: project,
      assigneeId: assignee?.id,
      assignee: assignee,
      tags: tags,
    });

    this.logger.log(`Task "${task.title}" created for project ${projectId} by user ${currentUserId}.`, 'create');
    return this.tasksRepository.save(task);
  }

  async findAll(currentUserId: string, projectId?: string, status?: TaskStatus): Promise<Task[]> {
    const queryBuilder = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags')
      .where('project.ownerId = :currentUserId', { currentUserId });

    if (projectId) {
      // Ensure the user owns this specific project before filtering tasks by it
      const project = await this.projectsService.checkProjectOwnership(projectId, currentUserId);
      if (!project) {
        throw new ForbiddenException(`Project with ID ${projectId} not found or not accessible.`);
      }
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, currentUserId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'tags', 'comments', 'comments.author'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    // Ensure the task's project belongs to the current user
    if (task.project.ownerId !== currentUserId) {
      throw new ForbiddenException(`You do not have access to task with ID ${id}.`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUserId: string): Promise<Task> {
    const { projectId, assigneeId, tagIds, ...taskDetails } = updateTaskDto;
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project', 'tags'], // Load existing tags for update
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    if (task.project.ownerId !== currentUserId) {
      throw new ForbiddenException(`You do not have access to task with ID ${id}.`);
    }

    // Handle Project update (if allowed, careful with ownership changes)
    if (projectId && projectId !== task.projectId) {
      const newProject = await this.projectsService.findOne(projectId, currentUserId);
      if (!newProject) {
        throw new BadRequestException(`New project with ID ${projectId} not found or not accessible.`);
      }
      task.project = newProject;
      task.projectId = newProject.id;
    }

    // Handle Assignee update
    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        task.assignee = null;
        task.assigneeId = null;
      } else {
        const newAssignee = await this.usersService.findById(assigneeId);
        if (!newAssignee) {
          throw new BadRequestException(`Assignee with ID ${assigneeId} not found.`);
        }
        task.assignee = newAssignee;
        task.assigneeId = newAssignee.id;
      }
    }

    // Handle Tags update
    if (tagIds !== undefined) {
      if (tagIds.length === 0) {
        task.tags = []; // Clear all tags
      } else {
        const newTags = await this.tagsService.findManyByIds(tagIds);
        if (newTags.length !== tagIds.length) {
          throw new BadRequestException('One or more provided tag IDs are invalid.');
        }
        task.tags = newTags;
      }
    }

    Object.assign(task, taskDetails);
    this.logger.log(`Task ${id} updated by user ${currentUserId}.`, 'update');
    return this.tasksRepository.save(task);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    if (task.project.ownerId !== currentUserId) {
      throw new ForbiddenException(`You do not have access to task with ID ${id}.`);
    }

    await this.tasksRepository.remove(task);
    this.logger.log(`Task ${id} removed by user ${currentUserId}.`, 'remove');
  }
}