import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WinstonLogger } from '../common/logger/winston.logger';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: WinstonLogger,
  ) {
    this.logger.setContext('UsersService');
  }

  /**
   * Creates a new user.
   * @param createUserDto The DTO containing user creation data.
   * @returns The newly created user.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user: ${createUserDto.username}`);
    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  /**
   * Finds all users.
   * @returns An array of all users.
   */
  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return this.usersRepository.find();
  }

  /**
   * Finds a user by their ID.
   * @param id The ID of the user.
   * @returns The user if found.
   * @throws NotFoundException if the user is not found.
   */
  async findById(id: string): Promise<User> {
    this.logger.log(`Fetching user by ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User with ID ${id} not found.`);
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  /**
   * Finds a user by their username.
   * @param username The username of the user.
   * @returns The user if found, otherwise null.
   */
  async findByUsername(username: string): Promise<User | null> {
    this.logger.log(`Fetching user by username: ${username}`);
    return this.usersRepository.findOne({ where: { username } });
  }

  /**
   * Updates an existing user.
   * @param id The ID of the user to update.
   * @param updateUserDto The DTO containing update data.
   * @returns The updated user.
   * @throws NotFoundException if the user is not found.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);
    const user = await this.findById(id); // Ensures user exists
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  /**
   * Deletes a user.
   * @param id The ID of the user to delete.
   * @returns True if deletion was successful.
   * @throws NotFoundException if the user is not found.
   */
  async remove(id: string): Promise<boolean> {
    this.logger.log(`Attempting to remove user with ID: ${id}`);
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Deletion failed: User with ID ${id} not found.`);
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    this.logger.log(`User with ID ${id} successfully removed.`);
    return true;
  }
}