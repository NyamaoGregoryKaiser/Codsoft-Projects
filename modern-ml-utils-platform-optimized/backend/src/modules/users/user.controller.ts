import { Request, Response } from 'express';
import catchAsync from '../../shared/utils/catchAsync';

export const getMe = catchAsync(async (req: Request, res: Response) => {
  // User object is attached to req by the `protect` middleware
  res.send(req.user);
});