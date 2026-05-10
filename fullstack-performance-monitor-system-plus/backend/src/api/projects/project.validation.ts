import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters long'),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters long').optional(), // Allow partial updates
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;