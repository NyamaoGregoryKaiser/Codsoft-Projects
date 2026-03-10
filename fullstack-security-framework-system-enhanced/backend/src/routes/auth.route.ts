import express from 'express';
import { register, login, logout, refreshTokens, forgotPassword, resetPassword } from '@controllers/auth.controller';
import { validate } from '@middleware/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@validation/auth.validation';
import { authRateLimiter } from '@middleware/rateLimit.middleware';

export const authRoutes = express.Router();

authRoutes.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
authRoutes.post('/login', authRateLimiter, validate({ body: loginSchema }), login);
authRoutes.post('/logout', logout); // Logout only clears cookies, does not require auth token
authRoutes.post('/refresh-token', refreshTokens);
authRoutes.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
authRoutes.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);