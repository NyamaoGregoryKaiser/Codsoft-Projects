import { Router } from 'express';
import { authController } from './auth.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', protect, authController.getMe.bind(authController));

export default router;