import { z } from 'zod';
import { UserRoles } from '@constants/roles';

export const getUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum([UserRoles.USER, UserRoles.ADMIN]).optional(),
}).partial(); // All fields are optional for update

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must not exceed 128 characters')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/\d/, 'New password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'New password must contain at least one special character'),
});

export type GetUserParams = z.infer<typeof getUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;