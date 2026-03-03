import { TasksService } from '../../modules/tasks/tasks.service';
import { AppDataSource } from '../../database';
import { Task, TaskPriority, TaskStatus } from '../../database/entities/Task';
import { User, UserRole } from '../../database/entities/User';
import { CreateTaskDto } from '../../modules/tasks/dtos/CreateTask.dto';
import { UpdateTaskDto } from '../../modules/tasks/dtos/UpdateTask.dto';
import { TaskQueryParamsDto } from '../../modules/tasks/dtos/TaskQueryParams.dto';
import { NotFoundError } from '../../shared/errors';

describe('TasksService Unit Tests', () => {
  let tasksService: TasksService;
  let taskRepositoryMock: any;
  let userRepositoryMock: any;

  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    assignedTasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  };

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'A test description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(),
    assignee: mockUser,
    assigneeId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  };

  beforeEach(() => {
    taskRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    userRepositoryMock = {
      findOneBy: jest.fn(),
    };

    jest.spyOn(AppDataSource, 'getRepository')
      .mockImplementation((entity) => {
        if (entity === Task) return taskRepositoryMock;
        if (entity === User) return userRepositoryMock;
        return null;
      });

    tasksService = new TasksService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        assigneeId: mockUser.id,
      };

      userRepositoryMock.findOneBy.mockResolvedValue(mockUser);
      taskRepositoryMock.create.mockReturnValue({ ...createTaskDto, assignee: mockUser });
      taskRepositoryMock.save.mockResolvedValue({ ...mockTask, ...createTaskDto, id: 'new-task-id', assignee: mockUser });

      const result = await tasksService.createTask(createTaskDto);

      expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
      expect(taskRepositoryMock.create).toHaveBeenCalledWith(createTaskDto);
      expect(taskRepositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({
        title: createTaskDto.title,
        assignee: mockUser,
      }));
      expect(result).toHaveProperty('id', 'new-task-id');
      expect(result.assignee).toEqual(mockUser);
    });

    it('should throw NotFoundError if assignee does not exist', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        assigneeId: 'non-existent-user-id',
      };

      userRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(tasksService.createTask(createTaskDto)).rejects.toThrow(NotFoundError);
      expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-user-id' });
      expect(taskRepositoryMock.create).not.toHaveBeenCalled();
      expect(taskRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks with pagination', async () => {
      const queryParams: TaskQueryParamsDto = { page: 1, limit: 10 };
      taskRepositoryMock.createQueryBuilder().getManyAndCount.mockResolvedValue([[mockTask], 1]);

      const result = await tasksService.findAllTasks(queryParams);

      expect(taskRepositoryMock.createQueryBuilder).toHaveBeenCalled();
      expect(result.tasks).toEqual([mockTask]);
      expect(result.total).toEqual(1);
    });

    it('should filter tasks by status and assigneeId', async () => {
      const queryParams: TaskQueryParamsDto = { status: TaskStatus.PENDING, assigneeId: mockUser.id };
      taskRepositoryMock.createQueryBuilder().getManyAndCount.mockResolvedValue([[mockTask], 1]);

      await tasksService.findAllTasks(queryParams);

      expect(taskRepositoryMock.createQueryBuilder().andWhere).toHaveBeenCalledWith('task.status = :status', { status: TaskStatus.PENDING });
      expect(taskRepositoryMock.createQueryBuilder().andWhere).toHaveBeenCalledWith('task.assigneeId = :assigneeId', { assigneeId: mockUser.id });
    });
  });

  describe('findTaskById', () => {
    it('should return a task by ID', async () => {
      taskRepositoryMock.findOne.mockResolvedValue(mockTask);

      const result = await tasksService.findTaskById(mockTask.id);

      expect(taskRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: mockTask.id, isDeleted: false },
        relations: ['assignee'],
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      taskRepositoryMock.findOne.mockResolvedValue(null);

      await expect(tasksService.findTaskById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Title', status: TaskStatus.COMPLETED };
      const updatedTask = { ...mockTask, ...updateTaskDto };

      jest.spyOn(tasksService, 'findTaskById').mockResolvedValue(mockTask);
      taskRepositoryMock.save.mockResolvedValue(updatedTask);

      const result = await tasksService.updateTask(mockTask.id, updateTaskDto);

      expect(tasksService.findTaskById).toHaveBeenCalledWith(mockTask.id);
      expect(taskRepositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({
        id: mockTask.id,
        title: 'Updated Title',
        status: TaskStatus.COMPLETED,
      }));
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      jest.spyOn(tasksService, 'findTaskById').mockRejectedValue(new NotFoundError());
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Title' };

      await expect(tasksService.updateTask('non-existent-id', updateTaskDto)).rejects.toThrow(NotFoundError);
      expect(taskRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should update assignee if assigneeId is provided', async () => {
        const newAssignee: User = { ...mockUser, id: 'user-2', email: 'user2@example.com' };
        const updateTaskDto: UpdateTaskDto = { assigneeId: newAssignee.id };

        jest.spyOn(tasksService, 'findTaskById').mockResolvedValue(mockTask);
        userRepositoryMock.findOneBy.mockResolvedValue(newAssignee);
        taskRepositoryMock.save.mockResolvedValue({ ...mockTask, assignee: newAssignee, assigneeId: newAssignee.id });

        const result = await tasksService.updateTask(mockTask.id, updateTaskDto);

        expect(tasksService.findTaskById).toHaveBeenCalledWith(mockTask.id);
        expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: newAssignee.id });
        expect(result.assignee).toEqual(newAssignee);
        expect(taskRepositoryMock.save).toHaveBeenCalled();
    });

    it('should set assignee to null if assigneeId is null', async () => {
        const updateTaskDto: UpdateTaskDto = { assigneeId: null };

        jest.spyOn(tasksService, 'findTaskById').mockResolvedValue(mockTask);
        taskRepositoryMock.save.mockResolvedValue({ ...mockTask, assignee: null, assigneeId: undefined });

        const result = await tasksService.updateTask(mockTask.id, updateTaskDto);

        expect(tasksService.findTaskById).toHaveBeenCalledWith(mockTask.id);
        expect(userRepositoryMock.findOneBy).not.toHaveBeenCalled();
        expect(result.assignee).toBeNull();
        expect(result.assigneeId).toBeUndefined();
        expect(taskRepositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should soft delete a task successfully', async () => {
      jest.spyOn(tasksService, 'findTaskById').mockResolvedValue(mockTask);
      taskRepositoryMock.save.mockResolvedValue({ ...mockTask, isDeleted: true });

      await tasksService.deleteTask(mockTask.id);

      expect(tasksService.findTaskById).toHaveBeenCalledWith(mockTask.id);
      expect(mockTask.isDeleted).toBe(true);
      expect(taskRepositoryMock.save).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      jest.spyOn(tasksService, 'findTaskById').mockRejectedValue(new NotFoundError());

      await expect(tasksService.deleteTask('non-existent-id')).rejects.toThrow(NotFoundError);
      expect(taskRepositoryMock.save).not.toHaveBeenCalled();
    });
  });
});