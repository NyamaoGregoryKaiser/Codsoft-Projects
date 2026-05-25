import { Router } from 'express';
import * as userController from './user.controller';
import { protect } from '../../middleware/auth';
import { cache } from '../../middleware/cache';

const router = Router();

// Cache user profile for 5 minutes
router.get('/me', protect, cache(300), userController.getMe);

export default router;