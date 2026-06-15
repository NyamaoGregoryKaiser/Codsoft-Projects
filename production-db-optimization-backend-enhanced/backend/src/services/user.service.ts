import { PrismaClient, User, UserRole } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

const createUser = async (userData: Pick<User, 'email' | 'password' | 'firstName' | 'lastName' | 'role'>): Promise<User> => {
  const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
  if (existingUser) {
    throw new ApiError(400, 'Email already taken');
  }
  return prisma.user.create({ data: userData });
};

const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

const getAllUsers = async (page: number = 1, limit: number = 10): Promise<User[]> => {
  const skip = (page - 1) * limit;
  return prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } });
};

const updateUser = async (id: string, updateData: Partial<User>): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
  });
};

const deleteUser = async (id: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  await prisma.user.delete({ where: { id } });
};

export { createUser, getUserById, getUserByEmail, getAllUsers, updateUser, deleteUser };
```