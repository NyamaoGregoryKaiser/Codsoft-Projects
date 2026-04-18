import { Repository } from 'typeorm';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { AppDataSource } from '../../data-source';
import { CreateUserDto, UpdateUserDto } from './user.dtos';
import { hashPassword } from '../../utils/auth';
import { ConflictException, NotFoundException, BadRequestException } from '../../middlewares/error.middleware';
import { RoleService } from '../roles/role.service';
import logger from '../../config/logger';

export class UserService {
  private userRepository: Repository<User>;
  private roleService: RoleService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleService = new RoleService();
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'] });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['role'] });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.getUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists`);
    }

    const role = await this.roleService.getRoleByName(createUserDto.roleName);
    if (!role) {
      throw new BadRequestException(`Role '${createUserDto.roleName}' not found`);
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    const newUser = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: role,
    });
    return this.userRepository.save(newUser);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.getUserByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with email '${updateUserDto.email}' already exists`);
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      user.password = await hashPassword(updateUserDto.password);
    }
    if (updateUserDto.firstName) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) user.lastName = updateUserDto.lastName;

    if (updateUserDto.roleName && updateUserDto.roleName !== user.role.name) {
      const newRole = await this.roleService.getRoleByName(updateUserDto.roleName);
      if (!newRole) {
        throw new BadRequestException(`Role '${updateUserDto.roleName}' not found`);
      }
      user.role = newRole;
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.userRepository.remove(user);
    logger.info(`User with ID ${id} deleted successfully.`);
  }
}