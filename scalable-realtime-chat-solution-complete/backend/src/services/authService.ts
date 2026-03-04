```typescript
import { prisma } from '../config/prisma';
import { hashPassword, comparePasswords } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { logger } from '../config/logger';

export const registerUser = async (username: string, email: string, passwordHash: string) => {
  try {
    const hashedPassword = await hashPassword(passwordHash);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    logger.info(`User registered: ${username}`);
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
  } catch (error: any) {
    logger.error(`Error registering user ${username}:`, error);
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error('Username or email already exists.');
    }
    throw new Error('Failed to register user.');
  }
};

export const loginUser = async (email: string, passwordHash: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await comparePasswords(passwordHash, user.password))) {
      logger.warn(`Failed login attempt for email: ${email}`);
      throw new Error('Invalid credentials.');
    }

    const token = generateToken(user.id, user.username);
    logger.info(`User logged in: ${user.username}`);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    };
  } catch (error) {
    logger.error(`Error during login for email ${email}:`, error);
    throw error; // Re-throw the specific error message
  }
};
```