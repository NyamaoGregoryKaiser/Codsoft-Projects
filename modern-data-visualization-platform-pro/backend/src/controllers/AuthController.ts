import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/UserService';
import { generateAuthToken } from '@utils/jwt';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

/**
 * @class AuthController
 * @description Handles user authentication and registration requests.
 */
export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Registers a new user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        throw new AppError('Username, email, and password are required', 400);
      }

      const newUser = await this.userService.registerUser(username, email, password);
      const token = generateAuthToken(newUser.id);

      logger.info(`User registered successfully: ${newUser.email}`);
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        token,
      });
    } catch (error) {
      logger.error('Error during user registration:', error);
      next(error);
    }
  };

  /**
   * Logs in an existing user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const user = await this.userService.loginUser(email, password);
      const token = generateAuthToken(user.id);

      logger.info(`User logged in successfully: ${user.email}`);
      res.status(200).json({
        message: 'Logged in successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      logger.error('Error during user login:', error);
      next(error);
    }
  };

  /**
   * Retrieves the profile of the currently authenticated user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // User ID is attached to req.user by authMiddleware
      const userId = (req as any).user.id;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      next(error);
    }
  };
}