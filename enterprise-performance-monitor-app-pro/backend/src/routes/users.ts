import { Router } from 'express';
import { getUserById, updateUser, deleteUser } from '../controllers/user';
import { authenticate } from '../middleware/auth';

const router = Router();

// In a real app, user management would be more extensive,
// e.g., only admins can list/delete other users.
// For simplicity, users can only manage their own profile here.

router.route('/:id')
  .get(authenticate, getUserById)
  .put(authenticate, updateUser)
  .delete(authenticate, deleteUser); // Needs authorization to ensure user deletes only themselves or is admin

export default router;