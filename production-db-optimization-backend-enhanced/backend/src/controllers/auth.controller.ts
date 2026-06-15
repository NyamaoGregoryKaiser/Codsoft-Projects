import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { ApiError } from '../middlewares/error.middleware';

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }
    const { user, token } = await registerUser(email, password, firstName, lastName);
    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }
    const { user, token } = await loginUser(email, password);
    res.status(200).json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    // In a real app, you might fetch fresh user data from DB.
    // For now, return what's in the token.
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

export { register, login, getMe };
```