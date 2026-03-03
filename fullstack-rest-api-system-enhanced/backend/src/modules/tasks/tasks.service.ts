import { AppDataSource } from '../../database';
import { Task } from '../../database/entities/Task';
import { CreateTaskDto } from './dtos/CreateTask.dto';
import { UpdateTaskDto } from './dtos/UpdateTask.dto';
import { TaskQueryParamsDto } from './dtos/TaskQueryParams.dto';
import { NotFoundError } from '../../shared/errors';
import { User } from '../../database/entities/User';

export class TasksService {
  private taskRepository = AppDataSource.getRepository(Task);
  private userRepository = AppDataSource.getRepository(User);

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);

    if (createTaskDto.assigneeId) {
      const assignee = await this.userRepository.findOneBy({ id: createTaskDto.assigneeId });
      if (!assignee) {
        throw new NotFoundError(`Assignee with ID ${createTaskDto.assigneeId} not found`);
      }
      task.assignee = assignee;
    }

    return this.taskRepository.save(task);
  }

  async findAllTasks(queryParams: TaskQueryParamsDto): Promise<{ tasks: Task[]; total: number }> {
    const { page = 1, limit = 10, status, priority, assigneeId, search } = queryParams;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee') // Eager load assignee
      .where('task.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }
    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    const [tasks, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

    return { tasks, total };
  }

  async findTaskById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['assignee'], // Load assignee for a single task
    });

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }
    return task;
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTaskById(id); // Reuses find method for existence check

    if (updateTaskDto.assigneeId !== undefined) {
        if (updateTaskDto.assigneeId === null) {
            task.assignee = null;
            task.assigneeId = undefined;
        } else {
            const assignee = await this.userRepository.findOneBy({ id: updateTaskDto.assigneeId });
            if (!assignee) {
                throw new NotFoundError(`Assignee with ID ${updateTaskDto.assigneeId} not found`);
            }
            task.assignee = assignee;
        }
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.findTaskById(id);
    task.isDeleted = true; // Soft delete
    await this.taskRepository.save(task);
  }
}