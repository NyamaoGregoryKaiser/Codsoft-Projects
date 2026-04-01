import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../validators/auth.validator';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerData = plainToClass(RegisterDto, req.body);
      await validateOrReject(registerData, { validationError: { target: false } });

      const { user, accessToken, refreshToken } = await this.authService.register(registerData);
      res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) {
      logger.error(`AuthController - register failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) { // class-validator errors
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginData = plainToClass(LoginDto, req.body);
      await validateOrReject(loginData, { validationError: { target: false } });

      const { user, accessToken, refreshToken } = await this.authService.login(loginData);
      res.status(200).json({ user, accessToken, refreshToken });
    } catch (error) {
      logger.error(`AuthController - login failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) { // class-validator errors
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new HttpException(400, 'Refresh token is required.');
      }
      const { accessToken } = await this.authService.refreshToken(refreshToken);
      res.status(200).json({ accessToken });
    } catch (error) {
      logger.error(`AuthController - refreshToken failed: ${error.message}`, error.stack);
      next(error);
    }
  };
}