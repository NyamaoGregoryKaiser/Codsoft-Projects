```typescript
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { UserRole } from '../models/User';
import { authorize } from '../middleware/authorize';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe); // Get authenticated user's profile

export default router;
```