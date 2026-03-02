import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation, validate } from '../utils/validation';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', authenticate, getMe);

export default router;