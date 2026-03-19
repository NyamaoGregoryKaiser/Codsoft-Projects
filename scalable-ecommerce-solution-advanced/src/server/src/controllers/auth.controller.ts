import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/auth.service';

class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      // Generate tokens after successful registration
      const { user: loggedInUser, tokens } = await authService.login(req.body.email, req.body.password);
      res.status(StatusCodes.CREATED).json({ user: loggedInUser, tokens });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);
      res.status(StatusCodes.OK).json({ user, tokens });
    } catch (error) {
      next(error);
    }
  }

  public async refreshTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const { user, tokens } = await authService.refreshTokens(refreshToken);
      res.status(StatusCodes.OK).json({ user, tokens });
    } catch (error) {
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is populated by the authenticate middleware
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not authenticated' });
      }
      const { id, email, firstName, lastName, role } = req.user;
      res.status(StatusCodes.OK).json({ id, email, firstName, lastName, role });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();