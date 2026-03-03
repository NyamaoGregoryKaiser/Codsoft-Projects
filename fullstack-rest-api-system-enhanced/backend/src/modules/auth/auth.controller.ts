import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterUserDto } from './dtos/RegisterUser.dto';
import { AuthPayloadDto } from './dtos/AuthPayload.dto';
import { AuthRequest } from '../../shared/interfaces/AuthRequest.interface';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const registerData = plainToInstance(RegisterUserDto, req.body);
      const errors = await validate(registerData);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      const { user, token } = await this.authService.register(registerData);
      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginData = plainToInstance(AuthPayloadDto, req.body);
      const errors = await validate(loginData);
      if (errors.length > 0) {
        return next({ name: 'ValidationError', errors });
      }

      const { user, token } = await this.authService.login(loginData.email, loginData.password);
      res.status(200).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!; // User is guaranteed to exist by protect middleware
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController(new AuthService());