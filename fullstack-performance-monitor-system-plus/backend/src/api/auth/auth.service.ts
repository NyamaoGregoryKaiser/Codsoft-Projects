import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma-client';
import { AppError } from '../../error';
import { RegisterUserInput } from './auth.validation';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const signToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const register = async (userData: RegisterUserInput) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash: hashedPassword,
    },
    select: { id: true, email: true, name: true },
  });

  return user;
};

export const login = async (email: string, password_plain: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password_plain, user.passwordHash))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(user.id);
  return { token, user };
};