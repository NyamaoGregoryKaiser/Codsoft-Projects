import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', rateLimitMiddleware, authController.register);
router.post('/login', rateLimitMiddleware, authController.login);
router.post('/refresh-token', rateLimitMiddleware, authController.refreshToken);

export default router;