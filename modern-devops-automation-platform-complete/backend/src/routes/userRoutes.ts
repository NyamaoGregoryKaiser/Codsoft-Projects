```typescript
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware); // Protect all user routes

router.get('/profile', userController.getUserProfile.bind(userController));

export default router;
```