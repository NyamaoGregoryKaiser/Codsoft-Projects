import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { ApiError } from '../middlewares/error.middleware';
import { getUserByEmail } from './user.service';

const prisma = new PrismaClient();

const registerUser = async (email: string, password: string, firstName?: string, lastName?: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'USER', // Default role
    },
  });
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
};

const loginUser = async (email: string, password: string) => {
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
};

export { registerUser, loginUser };
```