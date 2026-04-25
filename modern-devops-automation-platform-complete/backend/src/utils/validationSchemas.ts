```typescript
import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof loginSchema>;


// Project Schemas
export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters long'),
  description: z.string().nullable().optional(),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters long').optional(),
  description: z.string().nullable().optional(),
}).refine(data => data.name !== undefined || data.description !== undefined, {
  message: 'At least one field (name or description) must be provided for update',
});
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;


// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters long'),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending').optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format, expected ISO 8601' }).nullable().optional(),
  assignedToId: z.string().uuid('Invalid assignedToId format').nullable().optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters long').optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().datetime({ message: 'Invalid date format, expected ISO 8601' }).nullable().optional(),
  assignedToId: z.string().uuid('Invalid assignedToId format').nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
```