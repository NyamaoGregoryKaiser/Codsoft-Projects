```typescript
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const getUserProfile = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      logger.warn(`User profile not found for ID: ${userId}`);
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error(`Error fetching user profile for ID ${userId}:`, error);
    throw new Error('Could not fetch user profile');
  }
};

export const updateUserProfile = async (userId: string, data: { username?: string; email?: string }) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data,
      select: {
        id: true,
        username: true,
        email: true,
        updatedAt: true,
      },
    });
    logger.info(`User profile updated for ID: ${userId}`);
    return updatedUser;
  } catch (error: any) {
    logger.error(`Error updating user profile for ID ${userId}:`, error);
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error('Username or email already exists.');
    }
    throw new Error('Could not update user profile');
  }
};

export const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: 'asc',
      }
    });
    return users;
  } catch (error) {
    logger.error('Error fetching all users:', error);
    throw new Error('Could not fetch users');
  }
};
```