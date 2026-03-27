import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AppDataSource } from '../../db/data-source';

export class UserRepository extends Repository<User> {
  constructor() {
    super(User, AppDataSource.manager);
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.findOne({ where: [{ email: identifier }, { username: identifier }] });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOneBy({ id });
  }

  // Example of a more complex query if needed
  async findUsersWithProjects(): Promise<User[]> {
    return this.find({ relations: ['createdProjects'] });
  }
}