```typescript
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database/db';
import { APIError } from '../utils/error';
import { User, UserRole } from '../models/User';
import logger from '../utils/logger';

const db = getDb();

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users').all() as Omit<User, 'password'>[];
    logger.debug('Retrieved all users (admin action)');
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error fetching all users:', error);
    next(new APIError('Failed to fetch users', 500, error as Error));
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?').get(id) as Omit<User, 'password'> | undefined;

    if (!user) {
      return next(new APIError('User not found', 404));
    }
    logger.debug(`Retrieved user by ID: ${id} (admin action)`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error fetching user by ID ${id}:`, error);
    next(new APIError('Failed to fetch user', 500, error as Error));
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  if (!username && !email && !role) {
    return next(new APIError('No update data provided', 400));
  }

  // Basic validation for role
  if (role && ![UserRole.Admin, UserRole.User].includes(role)) {
    return next(new APIError('Invalid role provided. Must be "admin" or "user".', 400));
  }

  try {
    const userToUpdate = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!userToUpdate) {
      return next(new APIError('User not found', 404));
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (username) {
      fieldsToUpdate.push('username = ?');
      values.push(username);
    }
    if (email) {
      fieldsToUpdate.push('email = ?');
      values.push(email);
    }
    if (role) {
      fieldsToUpdate.push('role = ?');
      values.push(role);
    }
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

    if (fieldsToUpdate.length === 0) {
      return next(new APIError('No valid fields to update', 400));
    }

    const stmt = db.prepare(`UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values, id);

    if (result.changes === 0) {
      return next(new APIError('Failed to update user or no changes made', 500));
    }
    logger.info(`User ${id} updated by admin. Fields: ${fieldsToUpdate.join(', ')}`);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return next(new APIError('Email or username already in use', 409));
    }
    logger.error(`Error updating user ${id}:`, error);
    next(new APIError('Failed to update user', 500, error as Error));
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves (if ID matches the current admin user)
  if (req.user?.id === id && req.user.role === UserRole.Admin) {
    return next(new APIError('Admin cannot delete their own account', 403));
  }

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return next(new APIError('User not found', 404));
    }
    logger.info(`User ${id} deleted by admin.`);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting user ${id}:`, error);
    next(new APIError('Failed to delete user', 500, error as Error));
  }
};
```