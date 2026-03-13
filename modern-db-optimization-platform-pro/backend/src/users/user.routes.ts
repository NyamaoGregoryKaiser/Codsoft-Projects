```typescript
import { Router } from 'express';
import { userController, validateRegisterUser } from './user.controller';
import { protect, authorize } from '../shared/auth-middleware';
import { UserRole } from '../shared/enums';

const router = Router();

router.post('/register', validateRegisterUser, userController.register);
router.get('/profile', protect, userController.getProfile);
router.get('/', protect, authorize([UserRole.ADMIN]), userController.getAllUsers); // Admin only for listing all users

export default router;
```