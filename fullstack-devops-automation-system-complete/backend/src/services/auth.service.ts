```typescript
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CustomError } from '../utils/errors';
import { generateToken } from '../utils/jwt';
import { UserRole } from '../types/enums';

const userRepository = AppDataSource.getRepository(User);

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  role: UserRole
): Promise<Partial<User>> => {
  const existingUserByEmail = await userRepository.findOneBy({ email });
  if (existingUserByEmail) {
    throw new CustomError('Email already registered', 400);
  }

  const existingUserByUsername = await userRepository.findOneBy({ username });
  if (existingUserByUsername) {
    throw new CustomError('Username already taken', 400);
  }

  const newUser = userRepository.create({ username, email, password, role });
  await userRepository.save(newUser);

  // Return partial user data without password hash
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUser = async (email: string, password: string): Promise<{ user: Partial<User>; token: string }> => {
  const user = await userRepository.findOneBy({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new CustomError('Invalid credentials', 401);
  }

  const token = generateToken(user.id, user.email, user.role);

  // Return partial user data without password hash
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
```