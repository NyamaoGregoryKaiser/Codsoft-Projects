import { AppDataSource } from '../ormconfig';
import { ScrapeLog } from '../entities/ScrapeLog';
import { Repository } from 'typeorm';

export const ScrapeLogRepository: Repository<ScrapeLog> = AppDataSource.getRepository(ScrapeLog).extend({
  findByJobId(jobId: string, limit: number = 100): Promise<ScrapeLog[]> {
    return this.find({
      where: { jobId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  },
});