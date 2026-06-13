```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/db';
import { jwtSecret, jwtExpiresIn } from '../config/jwt.config';
import { APIError } from '../utils/error';
import { User, UserRole } from '../models/User';
import logger from '../utils/logger';

const db = getDb();

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(new APIError('Missing required fields: username, email, password', 400));
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return next(new APIError('User with that email or username already exists', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
    const userId = result.lastInsertRowid;

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    logger.error(`Error registering user ${email}:`, error);
    next(new APIError('Failed to register user', 500, error as Error));
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new APIError('Missing required fields: email, password', 400));
  }

  try {
    const user = db.prepare('SELECT id, username, email, password, role FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new APIError('Invalid credentials', 401));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    logger.info(`User logged in successfully: ${email}`);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Error logging in user ${email}:`, error);
    next(new APIError('Failed to login', 500, error as Error));
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return next(new APIError('Unauthorized', 401));
  }

  try {
    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.user.id) as Omit<User, 'password'> | undefined;

    if (!user) {
      return next(new APIError('User not found', 404));
    }

    logger.debug(`Profile retrieved for user: ${user.email}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error fetching profile for user ${req.user.id}:`, error);
    next(new APIError('Failed to fetch user profile', 500, error as Error));
  }
};
```