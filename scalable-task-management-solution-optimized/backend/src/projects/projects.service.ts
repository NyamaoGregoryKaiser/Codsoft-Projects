import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AppLogger } from '../shared/logger/app-logger.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ProjectsService.name);
  }

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      ownerId: userId,
    });
    this.logger.log(`Project created by user ${userId}: ${project.name}`, 'create');
    return this.projectsRepository.save(project);
  }

  async findAll(userId: string): Promise<Project[]> {
    // Return projects owned by the user
    return this.projectsRepository.find({
      where: { ownerId: userId },
      relations: ['owner'], // Eager load owner for display if needed
    });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, ownerId: userId },
      relations: ['owner', 'tasks'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found or you don't have access.`);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id, ownerId: userId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found or you don't have access.`);
    }

    Object.assign(project, updateProjectDto);
    this.logger.log(`Project ${id} updated by user ${userId}.`, 'update');
    return this.projectsRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.projectsRepository.delete({ id, ownerId: userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found or you don't have access.`);
    }
    this.logger.log(`Project ${id} deleted by user ${userId}.`, 'remove');
  }

  async checkProjectOwnership(projectId: string, userId: string): Promise<boolean> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId, ownerId: userId } });
    return !!project;
  }
}