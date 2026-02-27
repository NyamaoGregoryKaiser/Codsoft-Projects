```typescript
import { ConflictException, Injectable, NotFoundException, CACHE_MANAGER, Inject } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../common/logger/logger.service';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  private readonly USER_CACHE_KEY_PREFIX = 'user:';

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      this.logger.warn(`User creation failed: Email ${createUserDto.email} already exists.`, UsersService.name);
      throw new ConflictException(`User with email "${createUserDto.email}" already exists.`);
    }

    const user = this.usersRepository.create(createUserDto);
    await this.usersRepository.save(user);
    this.logger.log(`User created: ${user.id}`, UsersService.name);
    // Invalidate cache for users list or specific user entry if it exists
    await this.cacheManager.del(this.USER_CACHE_KEY_PREFIX + 'all');
    return user;
  }

  async findAll(): Promise<User[]> {
    const cachedUsers = await this.cacheManager.get<User[]>(this.USER_CACHE_KEY_PREFIX + 'all');
    if (cachedUsers) {
      this.logger.debug('Returning users from cache', UsersService.name);
      return cachedUsers;
    }

    const users = await this.usersRepository.find({ select: ['id', 'name', 'email', 'roles', 'createdAt', 'updatedAt'] });
    await this.cacheManager.set(this.USER_CACHE_KEY_PREFIX + 'all', users, { ttl: 60 }); // Cache for 60 seconds
    this.logger.log('Returning users from database', UsersService.name);
    return users;
  }

  async findById(id: string): Promise<User> {
    const cachedUser = await this.cacheManager.get<User>(this.USER_CACHE_KEY_PREFIX + id);
    if (cachedUser) {
      this.logger.debug(`Returning user ${id} from cache`, UsersService.name);
      return cachedUser;
    }

    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'roles', 'createdAt', 'updatedAt'], // Exclude password
    });
    if (!user) {
      this.logger.warn(`User not found: ${id}`, UsersService.name);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    await this.cacheManager.set(this.USER_CACHE_KEY_PREFIX + id, user, { ttl: 300 }); // Cache for 5 minutes
    this.logger.log(`Returning user ${id} from database`, UsersService.name);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user; // Return full user including password for authentication
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id); // Throws NotFoundException if not found

    // Check if new email conflicts with another user's email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserWithEmail = await this.usersRepository.findOneBy({ email: updateUserDto.email });
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        this.logger.warn(`User update failed for ${id}: Email ${updateUserDto.email} already in use.`, UsersService.name);
        throw new ConflictException(`Email "${updateUserDto.email}" is already in use by another user.`);
      }
    }

    // Only update allowed fields
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.roles) user.roles = updateUserDto.roles; // Only admin can update roles

    await this.usersRepository.save(user);
    this.logger.log(`User updated: ${id}`, UsersService.name);
    // Invalidate cache for the specific user and all users list
    await this.cacheManager.del(this.USER_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.USER_CACHE_KEY_PREFIX + 'all');
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`User deletion failed: ID ${id} not found.`, UsersService.name);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    this.logger.log(`User deleted: ${id}`, UsersService.name);
    // Invalidate cache for the specific user and all users list
    await this.cacheManager.del(this.USER_CACHE_KEY_PREFIX + id);
    await this.cacheManager.del(this.USER_CACHE_KEY_PREFIX + 'all');
  }
}
```