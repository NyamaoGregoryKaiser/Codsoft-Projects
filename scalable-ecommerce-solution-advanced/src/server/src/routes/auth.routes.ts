import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-tokens', authController.refreshTokens);
router.get('/me', authenticate, authController.getMe); // Example of protected route

export default router;