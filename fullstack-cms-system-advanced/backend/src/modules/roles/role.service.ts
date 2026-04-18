import { Repository } from 'typeorm';
import { Role } from '../../entities/Role';
import { AppDataSource } from '../../data-source';
import { CreateRoleDto, UpdateRoleDto } from './role.dtos';
import { ConflictException, NotFoundException } from '../../middlewares/error.middleware';
import logger from '../../config/logger';

export class RoleService {
  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOneBy({ name });
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.getRoleByName(createRoleDto.name);
    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
    }

    const newRole = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(newRole);
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.getRoleByName(updateRoleDto.name);
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`);
      }
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    await this.roleRepository.remove(role);
    logger.info(`Role with ID ${id} deleted successfully.`);
  }
}