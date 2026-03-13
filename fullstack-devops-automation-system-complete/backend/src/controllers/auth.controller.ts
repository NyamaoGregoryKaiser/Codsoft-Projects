```typescript
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { CustomError } from '../utils/errors';
import { UserRole } from '../types/enums';

// Regex for password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      throw new CustomError('Username, email, and password are required', 400);
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new CustomError(
        'Invalid password. Must be at least 8 characters, include uppercase, lowercase, number, and special character.',
        400
      );
    }

    if (role && !Object.values(UserRole).includes(role)) {
      throw new CustomError('Invalid role specified', 400);
    }

    // Only an existing ADMIN can register another ADMIN
    if (role === UserRole.ADMIN && (!req.user || req.user.role !== UserRole.ADMIN)) {
      throw new CustomError('Unauthorized: Only ADMIN can create ADMIN users', 403);
    }

    const newUser = await authService.registerUser(username, email, password, role || UserRole.USER);

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }

    const { user, token } = await authService.loginUser(email, password);

    res.status(200).json({ message: 'Logged in successfully', token, user });
  } catch (error) {
    next(error);
  }
};
```