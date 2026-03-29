```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errorHandler';
import { config } from '../config';
import logger from '../utils/logger';
import { User, UserRole } from '@prisma/client';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Generates a JWT token for the user
const signToken = (id: string, email: string, role: UserRole): string => {
  return jwt.sign({ id, email, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export const authService = {
  /**
   * Registers a new user.
   * @param data User registration data.
   * @returns User data and JWT token.
   */
  async register(data: RegisterInput): Promise<{ user: Omit<User, 'password'>; token: string }> {
    const { email, password, firstName, lastName } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.USER, // Default role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken(newUser.id, newUser.email, newUser.role);
    logger.info(`User registered: ${newUser.email}`);
    return { user: newUser, token };
  },

  /**
   * Logs in a user.
   * @param data User login credentials.
   * @returns User data and JWT token.
   */
  async login(data: LoginInput): Promise<{ user: Omit<User, 'password'>; token: string }> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials.', 401);
    }

    const token = signToken(user.id, user.email, user.role);
    logger.info(`User logged in: ${user.email}`);

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  /**
   * Verifies a JWT token. (Used by `protect` middleware)
   * This logic is primarily in the `auth` middleware, but a service function could
   * expose token verification if needed by other parts of the application.
   */
  verifyToken(token: string): jwt.JwtPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired.', 401);
      }
      if (err.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token.', 401);
      }
      throw new AppError('Token verification failed.', 500);
    }
  },
};
```