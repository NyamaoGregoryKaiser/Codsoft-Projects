```typescript
import express from 'express';
import * as authController from './auth.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../middleware/validation.middleware';
import { CreateUserDto, LoginUserDto } from './auth.dto';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import { UserRole } from '../../database/entities/user.entity';

const router = express.Router();

router.post('/register', authRateLimiter, validateBody(CreateUserDto), authController.register);
router.post('/login', authRateLimiter, validateBody(LoginUserDto), authController.login);
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe); // Get current authenticated user's profile

export default router;
```