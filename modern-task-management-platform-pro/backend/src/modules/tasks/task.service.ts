```typescript
import { AppDataSource } from '../../database/data-source';
import { Task, TaskStatus, TaskPriority } from '../../database/entities/task.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PaginatedResult } from '../../utils/pagination';

const taskRepository = AppDataSource.getRepository(Task);
const projectRepository = AppDataSource.getRepository(Project);
const userRepository = AppDataSource.getRepository(User);

// Helper to check user's access to a project
const checkProjectAccess = async (projectId: string, userId: string): Promise<Project> => {
  const project = await projectRepository.findOne({
    where: { id: projectId },
    relations: ['owner'],
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found.`);
  }

  if (project.owner.id !== userId) {
    // Check if user is an assignee on any task in this project for read access
    const hasAssignmentInProject = await taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.assigneeId = :userId', { userId })
      .getCount();

    if (hasAssignmentInProject === 0) {
      throw new ForbiddenError('You do not have permission to access tasks in this project.');
    }
  }
  return project;
};

// Helper to check user's access to a specific task
const checkTaskAccess = async (taskId: string, userId: string): Promise<Task> => {
  const task = await taskRepository.findOne({
    where: { id: taskId },
    relations: ['project', 'project.owner', 'assignee'],
  });

  if (!task) {
    throw new NotFoundError(`Task with ID ${taskId} not found.`);
  }

  // User must be project owner or task assignee
  const isOwner = task.project.owner.id === userId;
  const isAssignee = task.assignee?.id === userId;

  if (!isOwner && !isAssignee) {
    throw new ForbiddenError('You do not have permission to access this task.');
  }

  return task;
};


export const createTask = async (projectId: string, createTaskDto: CreateTaskDto, userId: string): Promise<Task> => {
  const project = await checkProjectAccess(projectId, userId); // Ensure project exists and user has access
  if (project.owner.id !== userId) {
    throw new ForbiddenError('Only the project owner can create tasks.');
  }

  let assignee: User | undefined;
  if (createTaskDto.assigneeId) {
    assignee = await userRepository.findOneBy({ id: createTaskDto.assigneeId });
    if (!assignee) {
      throw new NotFoundError(`Assignee with ID ${createTaskDto.assigneeId} not found.`);
    }
  }

  const newTask = new Task();
  newTask.title = createTaskDto.title;
  newTask.description = createTaskDto.description;
  newTask.status = createTaskDto.status || TaskStatus.TODO;
  newTask.priority = createTaskDto.priority || TaskPriority.MEDIUM;
  newTask.dueDate = createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined;
  newTask.project = project;
  newTask.assignee = assignee;

  try {
    const savedTask = await taskRepository.save(newTask);
    logger.info(`Task '${savedTask.title}' created in project ${projectId} by user ${userId}.`);
    return savedTask;
  } catch (error: any) {
    logger.error(`Error creating task for project ${projectId}:`, error);
    throw new BadRequestError('Could not create task. Please check your input.');
  }
};

export const findTasksByProject = async (projectId: string, userId: string, options: { limit: number; page: number; orderBy: string; orderDirection: 'ASC' | 'DESC' }): Promise<PaginatedResult<Task>> => {
  await checkProjectAccess(projectId, userId); // Ensure project exists and user has access

  const { limit, page, orderBy, orderDirection } = options;
  const skip = (page - 1) * limit;

  const [tasks, total] = await taskRepository.findAndCount({
    where: { project: { id: projectId } },
    relations: ['assignee'],
    take: limit,
    skip: skip,
    order: {
      [orderBy]: orderDirection,
    },
  });

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findTaskById = async (taskId: string, userId: string): Promise<Task> => {
  const task = await checkTaskAccess(taskId, userId);
  return task;
};

export const updateTask = async (taskId: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> => {
  const task = await checkTaskAccess(taskId, userId);

  // Only project owner can update task details, assignee can update status/priority/description.
  // For simplicity, we'll allow assignee to update most fields, but if stricter required, check task.project.owner.id === userId
  // For now, let's assume if you have access to modify the task, you can modify its details.

  if (updateTaskDto.assigneeId) {
    const newAssignee = await userRepository.findOneBy({ id: updateTaskDto.assigneeId });
    if (!newAssignee) {
      throw new NotFoundError(`Assignee with ID ${updateTaskDto.assigneeId} not found.`);
    }
    task.assignee = newAssignee;
  } else if (updateTaskDto.assigneeId === null) {
    task.assignee = undefined; // Unassign task
  }

  task.title = updateTaskDto.title || task.title;
  task.description = updateTaskDto.description !== undefined ? updateTaskDto.description : task.description; // Allow explicit null/empty string
  task.status = updateTaskDto.status || task.status;
  task.priority = updateTaskDto.priority || task.priority;
  task.dueDate = updateTaskDto.dueDate !== undefined ? (updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null) : task.dueDate;

  try {
    const updatedTask = await taskRepository.save(task);
    logger.info(`Task '${updatedTask.title}' (${updatedTask.id}) updated by user ${userId}.`);
    return updatedTask;
  } catch (error: any) {
    logger.error(`Error updating task ${taskId}:`, error);
    throw new BadRequestError('Could not update task. Please check your input.');
  }
};

export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
  const task = await checkTaskAccess(taskId, userId);

  if (task.project.owner.id !== userId) {
    throw new ForbiddenError('Only the project owner can delete tasks.');
  }

  const result = await taskRepository.delete(taskId);

  if (result.affected === 0) {
    throw new NotFoundError(`Task with ID ${taskId} not found (after permission check).`);
  }
  logger.info(`Task '${task.title}' (${taskId}) deleted by user ${userId}.`);
};
```