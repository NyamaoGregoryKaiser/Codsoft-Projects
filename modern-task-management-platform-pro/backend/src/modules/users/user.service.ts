```typescript
import { AppDataSource } from '../../database/data-source';
import { User, UserRole } from '../../database/entities/user.entity';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PaginatedResult } from '../../utils/pagination';
import { UpdateUserDto } from './user.dto';

const userRepository = AppDataSource.getRepository(User);

export const findAllUsers = async (options: { limit: number; page: number; orderBy: string; orderDirection: 'ASC' | 'DESC' }): Promise<PaginatedResult<User>> => {
  const { limit, page, orderBy, orderDirection } = options;
  const skip = (page - 1) * limit;

  const [users, total] = await userRepository.findAndCount({
    select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'], // Exclude password
    take: limit,
    skip: skip,
    order: {
      [orderBy]: orderDirection,
    },
  });

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findUserById = async (id: string): Promise<User> => {
  const user = await userRepository.findOne({
    where: { id },
    select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'], // Exclude password
  });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }
  return user;
};

export const updateUserProfile = async (id: string, updateData: UpdateUserDto): Promise<User> => {
  const user = await userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  // Ensure email uniqueness if it's being updated
  if (updateData.email && updateData.email !== user.email) {
    const existingUserWithEmail = await userRepository.findOneBy({ email: updateData.email });
    if (existingUserWithEmail) {
      throw new BadRequestError('Another user with this email already exists.');
    }
  }

  // Only allow certain fields to be updated by general users
  user.firstName = updateData.firstName || user.firstName;
  user.lastName = updateData.lastName || user.lastName;
  user.email = updateData.email || user.email;

  // Password update would typically be a separate route for security reasons
  // If password is in updateData, it should be hashed
  if (updateData.password) {
    user.password = updateData.password;
    await user.hashPassword(); // Hash the new password
  }

  try {
    const updatedUser = await userRepository.save(user);
    logger.info(`User profile ${updatedUser.id} updated.`);
    // Exclude password from the returned object
    const { password, ...result } = updatedUser;
    return result as User;
  } catch (error: any) {
    logger.error(`Error updating user ${id}:`, error);
    throw new BadRequestError('Could not update user profile. Please check your input.');
  }
};

export const updateUserRole = async (id: string, newRole: UserRole): Promise<User> => {
  const user = await userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  user.role = newRole;

  try {
    const updatedUser = await userRepository.save(user);
    logger.info(`User ${updatedUser.id} role updated to ${newRole}.`);
    const { password, ...result } = updatedUser;
    return result as User;
  } catch (error: any) {
    logger.error(`Error updating user ${id} role:`, error);
    throw new BadRequestError('Could not update user role.');
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  const result = await userRepository.delete(id);

  if (result.affected === 0) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }
  logger.info(`User ${id} deleted successfully.`);
};
```