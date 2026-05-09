import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as userService from './user.service';
import { ApiResponse, PaginatedResponse } from '../../types';

export const createUser = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User created successfully',
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

export const getAllUsers = async (req: Request, res: Response<PaginatedResponse<any>>, next: NextFunction) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const { users, meta } = await userService.getAllUsers(offset, limit);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { data: users, meta },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User retrieved successfully',
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

export const updateUserById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const user = await userService.updateUserById(req.params.userId, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User updated successfully',
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

export const deleteUserById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    await userService.deleteUserById(req.params.userId);
    res.status(StatusCodes.NO_CONTENT).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};