import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { RegisterUserDto, LoginUserDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', validationMiddleware(RegisterUserDto), authRateLimiter, authController.register);
router.post('/login', validationMiddleware(LoginUserDto), authRateLimiter, authController.login);
router.post('/refresh-token', authRateLimiter, authController.refreshToken);
router.post('/logout', authController.logout); // Logout doesn't need rate limit per se, but it's okay to have.
router.post('/forgot-password', validationMiddleware(ForgotPasswordDto), authRateLimiter, authController.forgotPassword);
router.post('/reset-password', validationMiddleware(ResetPasswordDto), authRateLimiter, authController.resetPassword);

// Protected routes examples
router.get('/profile', protect, authController.getProfile);
router.get('/admin-dashboard', protect, authorize([UserRole.ADMIN]), (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Welcome to the admin dashboard!',
    user: req.user,
  });
});

export default router;