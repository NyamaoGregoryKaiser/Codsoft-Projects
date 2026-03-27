import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './user.dtos';
import { ApiError } from '../../utils/apiError';
import { hashPassword } from '../../utils/password';
import logger from '../../config/logger';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(user => this.toUserResponseDto(user));
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }
    return this.toUserResponseDto(user);
  }

  async createUser(createDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmailOrUsername(createDto.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email or username already exists.');
    }

    const hashedPassword = createDto.password ? await hashPassword(createDto.password) : undefined;

    const newUser = this.userRepository.create({
      username: createDto.username,
      email: createDto.email,
      password: hashedPassword,
      role: createDto.role,
    });

    const savedUser = await this.userRepository.save(newUser);
    logger.info(`User created by admin: ${savedUser.email}`);
    return this.toUserResponseDto(savedUser);
  }

  async updateUser(id: string, updateDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOneBy({ email: updateDto.email });
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(409, 'User with this email already exists.');
      }
    }
    if (updateDto.username && updateDto.username !== user.username) {
      const existingUser = await this.userRepository.findOneBy({ username: updateDto.username });
      if (existingUser && existingUser.id !== id) {
        throw new ApiError(409, 'User with this username already exists.');
      }
    }

    if (updateDto.password) {
      updateDto.password = await hashPassword(updateDto.password);
    }

    Object.assign(user, updateDto);
    const updatedUser = await this.userRepository.save(user);
    logger.info(`User updated: ${updatedUser.email}`);
    return this.toUserResponseDto(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const deleteResult = await this.userRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new ApiError(404, 'User not found.');
    }
    logger.info(`User deleted: ${id}`);
  }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}