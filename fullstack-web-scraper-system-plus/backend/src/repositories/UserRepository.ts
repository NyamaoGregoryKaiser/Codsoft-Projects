import { AppDataSource } from '../ormconfig';
import { User } from '../entities/User';
import { Repository } from 'typeorm';

export const UserRepository: Repository<User> = AppDataSource.getRepository(User).extend({
  findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  },

  findByIdWithJobs(id: string): Promise<User | null> {
    return this.findOne({ where: { id }, relations: ['scrapeJobs'] });
  },
});