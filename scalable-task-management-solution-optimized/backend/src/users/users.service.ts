import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AppLogger } from '../shared/logger/app-logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User with ID ${id} not found.`, 'findById');
      // For sensitive info like users, it's better to return null and let the controller handle NotFoundException
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'username', 'email', 'password', 'roles', 'createdAt', 'updatedAt'], // Explicitly select password for login
    });
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    const updatedUser = Object.assign(user, updateUserDto);
    return this.usersRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}