import prisma from '../../config/prismaClient';
import { ApiError } from '../../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { UpdateUserInput } from './user.validation';
import { UserRole } from '@prisma/client';
import logger from '../../utils/logger';
import cache from '../../utils/cache';

const HASH_SALT_ROUNDS = 10;
const USER_CACHE_KEY_PREFIX = 'user:';
const ALL_USERS_CACHE_KEY = 'users:all';

export const getUsers = async () => {
  const cachedUsers = cache.get(ALL_USERS_CACHE_KEY);
  if (cachedUsers) {
    logger.debug('Fetching all users from cache.');
    return cachedUsers;
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  cache.set(ALL_USERS_CACHE_KEY, users);
  logger.debug('Fetching all users from DB and caching.');
  return users;
};

export const getUserById = async (id: string) => {
  const cachedUser = cache.get(`${USER_CACHE_KEY_PREFIX}${id}`);
  if (cachedUser) {
    logger.debug(`Fetching user ${id} from cache.`);
    return cachedUser;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  cache.set(`${USER_CACHE_KEY_PREFIX}${id}`, user);
  logger.debug(`Fetching user ${id} from DB and caching.`);
  return user;
};

export const updateUserDetails = async (id: string, data: UpdateUserInput, requestingUserRole: UserRole) => {
  const userToUpdate = await prisma.user.findUnique({ where: { id } });
  if (!userToUpdate) {
    throw new ApiError(404, 'User not found.');
  }

  // Prevent regular users from changing their role or other users' data
  if (requestingUserRole === 'USER' && userToUpdate.id !== id) {
    throw new ApiError(403, 'Users can only update their own profile.');
  }
  if (requestingUserRole === 'USER' && data.role && data.role !== userToUpdate.role) {
    throw new ApiError(403, 'Users are not allowed to change their role.');
  }
  
  if (data.email && data.email !== userToUpdate.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser && existingUser.id !== id) {
      throw new ApiError(409, 'Email already in use by another user.');
    }
  }

  const updateData: any = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, HASH_SALT_ROUNDS);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });

  cache.del(`${USER_CACHE_KEY_PREFIX}${id}`); // Invalidate single user cache
  cache.del(ALL_USERS_CACHE_KEY); // Invalidate all users cache
  logger.info(`User ${id} updated.`);
  return updatedUser;
};

export const deleteUser = async (id: string) => {
  const userToDelete = await prisma.user.findUnique({ where: { id } });
  if (!userToDelete) {
    throw new ApiError(404, 'User not found.');
  }

  // Delete all tasks associated with the user first
  await prisma.task.deleteMany({
    where: { userId: id },
  });

  await prisma.user.delete({ where: { id } });
  
  cache.del(`${USER_CACHE_KEY_PREFIX}${id}`); // Invalidate single user cache
  cache.del(ALL_USERS_CACHE_KEY); // Invalidate all users cache
  logger.info(`User ${id} and associated tasks deleted.`);
  return { message: 'User and associated tasks deleted successfully.' };
};