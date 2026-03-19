import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema } from './auth.validation';
import { ApiError } from '../../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.registerUser(validatedData);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { token, user } = await authService.loginUser(validatedData);
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) { // Zod validation error
      return next(new ApiError(400, (error as any).issues[0].message));
    }
    next(error);
  }
};