```typescript
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/rate-limiter';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', protect, register); // Admin only can register other admins
router.post('/login', loginRateLimiter, login);

export default router;
```