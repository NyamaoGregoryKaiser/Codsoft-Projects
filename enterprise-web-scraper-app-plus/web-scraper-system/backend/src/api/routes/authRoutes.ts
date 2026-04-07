```typescript
import { Router } from 'express';
import AuthService from '../../services/authService';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../../lib/validationSchemas';
import ApiResponse from '../../lib/ApiResponse';
import { protect } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { user } = await AuthService.register(req.body);
    res.status(201).json(ApiResponse.success(user, 'User registered successfully', 201));
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { user, token } = await AuthService.login(req.body);
    // You might want to send the token in a httpOnly cookie as well/instead
    res.status(200).json(ApiResponse.success({ user, token }, 'Login successful'));
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated'); // Should not happen with `protect` middleware
    }
    const user = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json(ApiResponse.success(user));
  } catch (error) {
    next(error);
  }
});

export default router;
```