import prisma from '../../config/prismaClient';
import { ApiError } from '../../middleware/errorHandler';
import { CreateTaskInput, UpdateTaskInput } from './task.validation';
import { UserRole } from '@prisma/client';
import logger from '../../utils/logger';
import cache from '../../utils/cache';

const TASK_CACHE_KEY_PREFIX = 'task:';
const USER_TASKS_CACHE_KEY_PREFIX = 'tasks:user:';
const ALL_TASKS_CACHE_KEY = 'tasks:all';

export const createTask = async (data: CreateTaskInput, userId: string) => {
  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  cache.del(`${USER_TASKS_CACHE_KEY_PREFIX}${userId}`); // Invalidate user's tasks cache
  cache.del(ALL_TASKS_CACHE_KEY); // Invalidate all tasks cache
  logger.info(`Task created by user ${userId}: ${task.title}`);
  return task;
};

export const getTasks = async (userId: string, userRole: UserRole) => {
  if (userRole === 'ADMIN') {
    const cachedTasks = cache.get(ALL_TASKS_CACHE_KEY);
    if (cachedTasks) {
      logger.debug('Fetching all tasks from cache (Admin).');
      return cachedTasks;
    }
    const allTasks = await prisma.task.findMany({
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    cache.set(ALL_TASKS_CACHE_KEY, allTasks);
    logger.debug('Fetching all tasks from DB and caching (Admin).');
    return allTasks;
  } else {
    const cachedUserTasks = cache.get(`${USER_TASKS_CACHE_KEY_PREFIX}${userId}`);
    if (cachedUserTasks) {
      logger.debug(`Fetching tasks for user ${userId} from cache.`);
      return cachedUserTasks;
    }
    const userTasks = await prisma.task.findMany({
      where: { userId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    cache.set(`${USER_TASKS_CACHE_KEY_PREFIX}${userId}`, userTasks);
    logger.debug(`Fetching tasks for user ${userId} from DB and caching.`);
    return userTasks;
  }
};

export const getTaskById = async (id: string, userId: string, userRole: UserRole) => {
  const cachedTask = cache.get(`${TASK_CACHE_KEY_PREFIX}${id}`);
  if (cachedTask) {
    logger.debug(`Fetching task ${id} from cache.`);
    return cachedTask;
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  // A user can only see their own tasks unless they are an admin
  if (task.userId !== userId && userRole !== 'ADMIN') {
    throw new ApiError(403, 'You are not authorized to view this task.');
  }

  cache.set(`${TASK_CACHE_KEY_PREFIX}${id}`, task);
  logger.debug(`Fetching task ${id} from DB and caching.`);
  return task;
};

export const updateTask = async (id: string, data: UpdateTaskInput, userId: string, userRole: UserRole) => {
  const existingTask = await prisma.task.findUnique({ where: { id } });

  if (!existingTask) {
    throw new ApiError(404, 'Task not found.');
  }

  // A user can only update their own tasks unless they are an admin
  if (existingTask.userId !== userId && userRole !== 'ADMIN') {
    throw new ApiError(403, 'You are not authorized to update this task.');
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  cache.del(`${TASK_CACHE_KEY_PREFIX}${id}`); // Invalidate single task cache
  cache.del(`${USER_TASKS_CACHE_KEY_PREFIX}${userId}`); // Invalidate user's tasks cache
  cache.del(ALL_TASKS_CACHE_KEY); // Invalidate all tasks cache
  logger.info(`Task ${id} updated by user ${userId}.`);
  return updatedTask;
};

export const deleteTask = async (id: string, userId: string, userRole: UserRole) => {
  const existingTask = await prisma.task.findUnique({ where: { id } });

  if (!existingTask) {
    throw new ApiError(404, 'Task not found.');
  }

  // A user can only delete their own tasks unless they are an admin
  if (existingTask.userId !== userId && userRole !== 'ADMIN') {
    throw new ApiError(403, 'You are not authorized to delete this task.');
  }

  await prisma.task.delete({ where: { id } });

  cache.del(`${TASK_CACHE_KEY_PREFIX}${id}`); // Invalidate single task cache
  cache.del(`${USER_TASKS_CACHE_KEY_PREFIX}${userId}`); // Invalidate user's tasks cache
  cache.del(ALL_TASKS_CACHE_KEY); // Invalidate all tasks cache
  logger.info(`Task ${id} deleted by user ${userId}.`);
  return { message: 'Task deleted successfully.' };
};