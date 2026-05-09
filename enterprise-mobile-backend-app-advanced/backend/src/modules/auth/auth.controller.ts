import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from './auth.service';
import { ApiResponse } from '../../types';

export const register = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.registerUser(email, password, name);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.loginUser(email, password);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged in successfully',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokens = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const newTokens = await authService.refreshAuthTokens(refreshToken);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: newTokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};