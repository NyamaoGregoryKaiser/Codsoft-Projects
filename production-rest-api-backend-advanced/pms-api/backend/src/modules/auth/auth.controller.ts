import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto, LoginUserDto } from './auth.dtos';
import { ApiError } from '../../utils/apiError';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerDto: RegisterUserDto = req.body;

      // Basic validation (can be enhanced with Joi/Zod)
      if (!registerDto.username || !registerDto.email || !registerDto.password) {
        throw new ApiError(400, 'Username, email, and password are required.');
      }
      if (registerDto.password.length < 6) {
        throw new ApiError(400, 'Password must be at least 6 characters long.');
      }

      const response = await this.authService.register(registerDto);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginDto: LoginUserDto = req.body;

      // Basic validation
      if (!loginDto.email || !loginDto.password) {
        throw new ApiError(400, 'Email and password are required.');
      }

      const response = await this.authService.login(loginDto);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}