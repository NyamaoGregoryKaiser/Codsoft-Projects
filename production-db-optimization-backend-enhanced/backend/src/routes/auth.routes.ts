import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import validate from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware(), authController.getMe); // Get current user info

export default router;
```