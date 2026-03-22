```javascript
const httpStatus = require('http-status');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const { hashPassword } = require('../utils/bcrypt');
const { invalidateCache } = require('../middlewares/cache');

const createUser = async (userData) => {
  if (await prisma.user.findUnique({ where: { email: userData.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await hashPassword(userData.password);
  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });
  invalidateCache('users'); // Invalidate user list cache
  return user;
};

const queryUsers = async (filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    where: filter,
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  const totalResults = await prisma.user.count({ where: filter });
  const totalPages = Math.ceil(totalResults / limit);

  return { users, totalResults, totalPages, page: parseInt(page), limit: parseInt(limit) };
};

const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });
};

const getUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const updateUserById = async (userId, updateBody) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && updateBody.email !== user.email && await prisma.user.findUnique({ where: { email: updateBody.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });
  invalidateCache('users'); // Invalidate user list cache
  return updatedUser;
};

const deleteUserById = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({ where: { id: userId } });
  invalidateCache('users'); // Invalidate user list cache
  return { message: 'User deleted successfully' };
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
```