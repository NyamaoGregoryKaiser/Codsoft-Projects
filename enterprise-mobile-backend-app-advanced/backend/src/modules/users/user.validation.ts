import { z } from 'zod';
import { UserRole } from '@prisma/client';

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(1, 'Name is required'),
    role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    role: z.nativeEnum(UserRole).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  }).partial(), // All fields are optional for update
});

const getUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

export { createUserSchema, updateUserSchema, getUserSchema, deleteUserSchema };