```typescript
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CustomError } from '../utils/errors';
import { UserRole } from '../types/enums';

const userRepository = AppDataSource.getRepository(User);

export const findAllUsers = async (): Promise<Partial<User>[]> => {
  const users = await userRepository.find({
    select: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'], // Exclude password hash
  });
  return users;
};

export const findUserById = async (id: string): Promise<Partial<User> | null> => {
  const user = await userRepository.findOne({
    where: { id },
    select: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'], // Exclude password hash
  });
  if (!user) {
    throw new CustomError(`User with ID ${id} not found`, 404);
  }
  return user;
};

export const updateUserRole = async (id: string, newRole: UserRole): Promise<Partial<User>> => {
  const userToUpdate = await userRepository.findOneBy({ id });
  if (!userToUpdate) {
    throw new CustomError(`User with ID ${id} not found`, 404);
  }

  userToUpdate.role = newRole;
  await userRepository.save(userToUpdate);

  // Return partial user data without password hash
  const { password: _, ...updatedUserWithoutPassword } = userToUpdate;
  return updatedUserWithoutPassword;
};

export const deleteUser = async (id: string): Promise<void> => {
  const userToDelete = await userRepository.findOneBy({ id });
  if (!userToDelete) {
    throw new CustomError(`User with ID ${id} not found`, 404);
  }
  await userRepository.remove(userToDelete);
};
```