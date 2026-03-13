```typescript
import { Router } from 'express';
import { getAllUsers, getUserById, updateUserRole, deleteUser } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// All user management routes require ADMIN role
router.get('/', protect, authorize([UserRole.ADMIN]), getAllUsers);
router.get('/:id', protect, authorize([UserRole.ADMIN]), getUserById);
router.patch('/:id/role', protect, authorize([UserRole.ADMIN]), updateUserRole);
router.delete('/:id', protect, authorize([UserRole.ADMIN]), deleteUser);

export default router;
```