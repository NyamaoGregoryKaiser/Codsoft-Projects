```typescript
import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Admin-specific routes
router.get('/', authorizeRoles(UserRole.Admin), getUsers);
router.get('/:id', authorizeRoles(UserRole.Admin), getUserById);
router.put('/:id', authorizeRoles(UserRole.Admin), updateUser);
router.delete('/:id', authorizeRoles(UserRole.Admin), deleteUser);

export default router;
```