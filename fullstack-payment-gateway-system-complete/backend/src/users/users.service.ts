import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppLogger } from '../common/logger/logger.service';
import { MerchantsService } from '../merchants/merchants.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly merchantsService: MerchantsService,
    private readonly logger: AppLogger,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(`Creating user with email: ${createUserDto.email}`, UsersService.name);
    const existingUser = await this.usersRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    if (createUserDto.merchantId) {
      const merchant = await this.merchantsService.findOne(createUserDto.merchantId);
      if (!merchant) {
        throw new NotFoundException(`Merchant with ID ${createUserDto.merchantId} not found`);
      }
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(merchantId?: string): Promise<User[]> {
    this.logger.debug(`Finding all users for merchantId: ${merchantId || 'all'}`, UsersService.name);
    const findOptions = merchantId ? { where: { merchantId } } : {};
    return this.usersRepository.find(findOptions);
  }

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user by ID: ${id}`, UsersService.name);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    this.logger.debug(`Finding user by email: ${email}`, UsersService.name);
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'merchantId'], // Explicitly select passwordHash for validation
    });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.debug(`Updating user ${id}`, UsersService.name);
    const user = await this.findById(id);

    if (updateUserDto.password) {
      updateUserDto.passwordHash = await argon2.hash(updateUserDto.password);
    }
    delete updateUserDto.password; // Remove plain password from DTO before saving

    if (updateUserDto.merchantId) {
        const merchant = await this.merchantsService.findOne(updateUserDto.merchantId);
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID ${updateUserDto.merchantId} not found`);
        }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`Removing user ${id}`, UsersService.name);
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}