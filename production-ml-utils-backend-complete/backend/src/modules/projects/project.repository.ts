```typescript
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { AppDataSource } from '../../database';
import { AppError } from '../../utils/appError';

export class ProjectRepository {
  private repository: Repository<Project>;

  constructor() {
    this.repository = AppDataSource.getRepository(Project);
  }

  async findById(id: string): Promise<Project | null> {
    return this.repository.findOne({ where: { id }, relations: ['owner'] });
  }

  async findAll(ownerId?: string): Promise<Project[]> {
    const whereCondition = ownerId ? { owner: { id: ownerId } } : {};
    return this.repository.find({ where: whereCondition, relations: ['owner'] });
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const project = this.repository.create(projectData);
    return this.repository.save(project);
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const result = await this.repository.update(id, updates);
    if (result.affected === 0) {
      throw new AppError('Project not found', 404);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new AppError('Project not found', 404);
    }
  }
}
```