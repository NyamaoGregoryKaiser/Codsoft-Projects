```typescript
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { logger } from '../config/logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const newUser = await authService.registerUser(username, email, password);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
    // next(error); // If we want to use the global error handler
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const loginResult = await authService.loginUser(email, password);
    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: loginResult.id,
        username: loginResult.username,
        email: loginResult.email,
      },
      token: loginResult.token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Login failed' });
    // next(error); // If we want to use the global error handler
  }
};
```