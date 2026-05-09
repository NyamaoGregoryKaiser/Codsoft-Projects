import { User, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/database';
import { ApiError } from '../../middleware/error.middleware';
import { hashPassword } from '../../utils/password';
import { PaginationMeta } from '../../types';

interface UserCreateData {
  email: string;
  password?: string;
  name: string;
  role?: UserRole;
}

interface UserUpdateData {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

/**
 * Create a new user.
 * @param data
 * @returns {User}
 */
export const createUser = async (data: UserCreateData): Promise<User> => {
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered');
  }
  const hashedPassword = data.password ? await hashPassword(data.password) : undefined;
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword || '', // Default to empty string if not provided and hashing is skipped
    },
  });
  return user;
};

/**
 * Get all users with pagination.
 * @param offset
 * @param limit
 * @returns {{ users: User[], meta: PaginationMeta }}
 */
export const getAllUsers = async (offset: number, limit: number): Promise<{ users: User[], meta: PaginationMeta }> => {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip: offset,
      take: limit,
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    meta: {
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID.
 * @param userId
 * @returns {User}
 */
export const getUserById = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * Update user by ID.
 * @param userId
 * @param data
 * @returns {User}
 */
export const updateUserById = async (userId: string, data: UserUpdateData): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (data.email && data.email !== user.email) {
    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered');
    }
  }

  const hashedPassword = data.password ? await hashPassword(data.password) : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      password: hashedPassword,
    },
  });
  return updatedUser;
};

/**
 * Delete user by ID.
 * @param userId
 * @returns {void}
 */
export const deleteUserById = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({ where: { id: userId } });
};