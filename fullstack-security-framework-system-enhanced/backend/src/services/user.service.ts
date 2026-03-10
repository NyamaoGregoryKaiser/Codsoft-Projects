import httpStatus from 'http-status';
import { prisma } from '@models/prisma';
import { AppError } from '@utils/appError';
import { UserMessages } from '@constants/messages';
import { UpdateUserBody } from '@validation/user.validation';
import { comparePassword, hashPassword } from '@utils/password';
import { AuthMessages } from '@constants/messages';
import { UserRoles } from '@constants/roles';

/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<User>}
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, UserMessages.USER_NOT_FOUND);
  }
  return user;
};

/**
 * Query for users
 * @param {object} filter - Prisma filter
 * @param {object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
export const queryUsers = async (filter: any, options: { limit?: number; page?: number; sortBy?: string }) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filter.name) {
    where.name = { contains: filter.name, mode: 'insensitive' };
  }
  if (filter.role) {
    where.role = filter.role;
  }

  const orderBy: any = {};
  const [field, order] = sortBy.split(':');
  orderBy[field] = order || 'desc';

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  const totalResults = await prisma.user.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return { users, totalPages, currentPage: page, totalResults };
};

/**
 * Update user by id
 * @param {string} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<User>}
 */
export const updateUserById = async (userId: string, updateBody: UpdateUserBody) => {
  const user = await getUserById(userId); // Ensure user exists

  if (updateBody.email && (await prisma.user.isEmailTaken(updateBody.email, userId))) {
    throw new AppError(httpStatus.CONFLICT, AuthMessages.EMAIL_ALREADY_EXISTS);
  }

  // Ensure role updates are only allowed by admins
  if (updateBody.role && updateBody.role !== user.role && user.role !== UserRoles.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, AuthMessages.FORBIDDEN);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  return updatedUser;
};

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId); // Ensure user exists
  await prisma.user.delete({ where: { id: userId } });
};

/**
 * Change user's password
 * @param {string} userId
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const changeUserPassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, UserMessages.USER_NOT_FOUND);
  }

  if (!(await comparePassword(oldPassword, user.password))) {
    throw new AppError(httpStatus.UNAUTHORIZED, AuthMessages.OLD_PASSWORD_MISMATCH);
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};