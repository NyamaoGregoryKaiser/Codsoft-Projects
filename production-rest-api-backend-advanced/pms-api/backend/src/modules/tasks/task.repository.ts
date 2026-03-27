import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { AppDataSource } from '../../db/data-source';

export class TaskRepository extends Repository<Task> {
  constructor() {
    super(Task, AppDataSource.manager);
  }

  async findTaskById(id: string, relations: string[] = []): Promise<Task | null> {
    return this.findOne({ where: { id }, relations });
  }

  async findTasksByProjectId(projectId: string, relations: string[] = []): Promise<Task[]> {
    return this.find({ where: { projectId }, relations });
  }
}