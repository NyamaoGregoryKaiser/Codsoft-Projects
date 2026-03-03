import { AppDataSource } from '../../database';
import { User } from '../../database/entities/User';
import { UpdateUserDto } from './dtos/UpdateUser.dto';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { UserResponseDto } from './dtos/UserResponse.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from '../../shared/dtos/Pagination.dto';

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);

  async findAllUsers(queryParams: PaginationDto): Promise<{ users: UserResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = queryParams;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'], // Select specific fields
    });

    const transformedUsers = plainToInstance(UserResponseDto, users);
    return { users: transformedUsers, total };
  }

  async findUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id, isDeleted: false } });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findOne({ where: { email: updateUserDto.email } });
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        throw new ConflictError('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return plainToInstance(UserResponseDto, user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id, isDeleted: false } });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    user.isDeleted = true; // Soft delete
    await this.userRepository.save(user);
  }
}