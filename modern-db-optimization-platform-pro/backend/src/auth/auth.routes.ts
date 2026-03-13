```typescript
import { Router } from 'express';
import { authController, validateLogin } from './auth.controller';

const router = Router();

router.post('/login', validateLogin, authController.login);

export default router;
```