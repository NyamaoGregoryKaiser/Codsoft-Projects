import prisma from '../../config/prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../middleware/errorHandler';
import { JWT_SECRET, JWT_EXPIRATION_TIME } from '../../config/config';
import { RegisterInput, LoginInput } from './auth.validation';
import logger from '../../utils/logger';

const HASH_SALT_ROUNDS = 10;

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(data.password, HASH_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'USER', // Default role for new users
    },
    select: { id: true, email: true, name: true, role: true },
  });

  logger.info(`User registered: ${user.email}`);
  return user;
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION_TIME }
  );

  logger.info(`User logged in: ${user.email}`);
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};