```typescript
import { Router } from 'express';
import { getMyProfile, updateMyProfile, getAllUsers } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.get('/', protect, getAllUsers); // Optional: Admin or for direct messages search

export default router;
```