import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/auth.service';
import { RegisterUserDto, LoginUserDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto';
import { CustomError } from '../types/errors';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as RegisterUserDto;
      const { accessToken, refreshToken, user } = await this.authService.register(email, password);

      // Set httpOnly refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'strict', // CSRF protection
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days (or match JWT_REFRESH_EXPIRATION)
      });

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: 'User registered successfully',
        data: { accessToken, user },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginUserDto;
      const { accessToken, refreshToken, user } = await this.authService.login(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Logged in successfully',
        data: { accessToken, user },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const oldRefreshToken = req.cookies.refreshToken;

      if (!oldRefreshToken) {
        throw new CustomError('No refresh token provided', StatusCodes.UNAUTHORIZED);
      }

      const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.refreshTokens(oldRefreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Tokens refreshed successfully',
        data: { accessToken, user },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      // Even if logout fails (e.g., token already invalid), still clear the cookie for the client
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      next(error); // Propagate error for logging/further handling
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as ForgotPasswordDto;
      await this.authService.forgotPassword(email);

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      // Still return a generic success message to prevent email enumeration
      if (error instanceof CustomError && error.statusCode === StatusCodes.NOT_FOUND) {
        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      }
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body as ResetPasswordDto;
      await this.authService.resetPassword(token, password);

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user is set by the `protect` middleware
      if (!req.user) {
        throw new CustomError('User not authenticated.', StatusCodes.UNAUTHORIZED);
      }

      // In a real app, you might fetch a more detailed user profile from a UserService
      // For simplicity, we just return the data from the token payload here
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'User profile fetched successfully',
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  };
}