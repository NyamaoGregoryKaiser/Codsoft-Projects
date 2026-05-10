import { Router } from 'express';
import * as authController from './auth.controller';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', apiRateLimiter, authController.register);
router.post('/login', apiRateLimiter, authController.login);

export { router as authRouter };