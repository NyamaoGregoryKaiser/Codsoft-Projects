import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  passwordConfirm: z.string().min(8, 'Password confirmation must be at least 8 characters long'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterUserInput = z.infer<typeof RegisterSchema>;
export type LoginUserInput = z.infer<typeof LoginSchema>;