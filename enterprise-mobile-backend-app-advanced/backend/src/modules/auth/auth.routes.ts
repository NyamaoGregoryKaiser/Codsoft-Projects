import { Router } from 'express';
import * as authController from './auth.controller';
import validate from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import rateLimit from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', rateLimit, validate(registerSchema), authController.register);
router.post('/login', rateLimit, validate(loginSchema), authController.login);
router.post('/refresh-tokens', rateLimit, validate(refreshTokenSchema), authController.refreshTokens);
router.post('/logout', rateLimit, validate(refreshTokenSchema), authController.logout);

export default router;