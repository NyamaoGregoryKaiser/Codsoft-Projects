import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format, expected ISO string' }).nullable().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters').optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format, expected ISO string' }).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const taskIdSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskIdParam = z.infer<typeof taskIdSchema>;