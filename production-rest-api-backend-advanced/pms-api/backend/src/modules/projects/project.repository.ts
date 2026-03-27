import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { AppDataSource } from '../../db/data-source';

export class ProjectRepository extends Repository<Project> {
  constructor() {
    super(Project, AppDataSource.manager);
  }

  async findProjectById(id: string, relations: string[] = []): Promise<Project | null> {
    return this.findOne({ where: { id }, relations });
  }

  async findAllProjects(relations: string[] = []): Promise<Project[]> {
    return this.find({ relations });
  }
}