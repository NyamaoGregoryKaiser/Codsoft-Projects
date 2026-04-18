import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from './auth.dtos';
import { validateRequest } from '../../utils/validation';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { UnauthorizedException } from '../../middlewares/error.middleware';
import { verifyRefreshToken } from '../../utils/auth';

const router = Router();
const authService = new AuthService();

router.post(
  '/login',
  authRateLimiter, // Apply rate limiting to login endpoint
  validateRequest(LoginUserDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(req.body as LoginUserDto);
      res.status(200).json({ accessToken, refreshToken, user });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh-token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // In a real application, you might want to check if the refresh token is valid and not blacklisted
      // This simple implementation just verifies it and generates a new access token
      const { accessToken } = await authService.refreshToken(refreshToken);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }
);

// Example protected route for testing
router.get(
  '/me',
  authRateLimiter, // Apply rate limiting
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    // Remove password before sending
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
  }
);

export const authRouter = router;