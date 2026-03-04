```typescript
import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', apiRateLimiter, register);
router.post('/login', apiRateLimiter, login);

export default router;
```