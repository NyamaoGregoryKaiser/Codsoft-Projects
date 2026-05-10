import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AppError } from '../../error';
import { RegisterSchema, LoginSchema } from './auth.validation';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const user = await authService.register(validatedData);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please login.',
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;
    const { token, user } = await authService.login(email, password);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};