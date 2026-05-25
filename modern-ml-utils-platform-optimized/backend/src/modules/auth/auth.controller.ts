import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/utils/catchAsync';
import * as authService from './auth.service';
import { clearCache } from '../../middleware/cache';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body);
  const token = authService.generateAuthToken(user.id);
  // Clear user-related caches after registration
  await clearCache('/api/v1/users/me'); 
  res.status(httpStatus.CREATED).send({ user, token });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  const token = authService.generateAuthToken(user.id);
  res.send({ user, token });
});