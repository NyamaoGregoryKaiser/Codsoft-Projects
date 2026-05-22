```typescript
import { Router } from 'express';
import { protect, restrictTo } from '../auth/auth.middleware';
import { getAllUsers, getUser, createUser, updateUser, deleteUser } from '../modules/users/user.controller';

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Admin-only routes for user management
router.use(restrictTo('admin'));

router.route('/')
  .get(getAllUsers)
  .post(createUser); // Admin can create users, possibly with roles

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

export default router;
```