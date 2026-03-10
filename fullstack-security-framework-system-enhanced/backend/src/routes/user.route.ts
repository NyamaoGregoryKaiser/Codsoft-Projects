import express from 'express';
import { getUsers, getUser, updateUser, deleteUser, changePassword } from '@controllers/user.controller';
import { auth, authorize } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import { getUserSchema, updateUserSchema, changePasswordSchema } from '@validation/user.validation';
import { UserRoles } from '@constants/roles';
import { apiRateLimiter } from '@middleware/rateLimit.middleware';

export const userRoutes = express.Router();

userRoutes.use(apiRateLimiter); // Apply rate limiting to all user routes
userRoutes.use(auth()); // All user routes require authentication

userRoutes.route('/')
  .get(authorize([UserRoles.ADMIN]), getUsers); // Only admins can list all users

userRoutes.route('/:userId')
  .get(authorize([UserRoles.ADMIN, UserRoles.USER]), validate({ params: getUserSchema }), getUser) // Admin can get any user, User can get self
  .patch(authorize([UserRoles.ADMIN, UserRoles.USER]), validate({ params: getUserSchema, body: updateUserSchema }), updateUser) // Admin can update any user, User can update self
  .delete(authorize([UserRoles.ADMIN]), validate({ params: getUserSchema }), deleteUser); // Only admins can delete users

userRoutes.post('/change-password', validate({ body: changePasswordSchema }), changePassword); // Authenticated user can change own password