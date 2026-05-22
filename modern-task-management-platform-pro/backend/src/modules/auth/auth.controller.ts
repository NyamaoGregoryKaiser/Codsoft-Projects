```typescript
import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import ApiResponse from '../../utils/apiResponse';
import { CreateUserDto, LoginUserDto } from './auth.dto';
import { User } from '../../database/entities/user.entity';

// Helper to send JWT token in cookie and response
const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = authService.signToken(user.id);
  const cookieOptions = {
    expires: new Date(Date.now() + authService.getJwtCookieExpiration() * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents client-side JS from reading the cookie
    secure: process.env.NODE_ENV === 'production', // Send cookie only on HTTPS in production
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(statusCode).json(ApiResponse.success(userResponse, 'Authentication successful', statusCode));
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createUserDto: CreateUserDto = req.body;
    const newUser = await authService.registerUser(createUserDto);
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginUserDto: LoginUserDto = req.body;
    const user = await authService.loginUser(loginUserDto);
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Expire immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('User not found on request after authentication.'));
  }
  // Exclude sensitive information like password
  const userResponse = {
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
  };
  res.status(200).json(ApiResponse.success(userResponse, 'Current user data fetched successfully'));
};
```