import { AppDataSource } from '../ormconfig';
import { ScrapeJob } from '../entities/ScrapeJob';
import { Repository } from 'typeorm';
import { ScrapeJobStatus } from '../types/enums';

export const ScrapeJobRepository: Repository<ScrapeJob> = AppDataSource.getRepository(ScrapeJob).extend({
  findActiveJobs(): Promise<ScrapeJob[]> {
    return this.find({
      where: { status: ScrapeJobStatus.ACTIVE, isDeleted: false },
      relations: ['user'], // Include user data for scheduler
    });
  },

  findByUser(userId: string): Promise<ScrapeJob[]> {
    return this.find({
      where: { userId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  },

  findByIdForUser(id: string, userId: string): Promise<ScrapeJob | null> {
    return this.findOne({
      where: { id, userId, isDeleted: false },
    });
  },

  findByIdWithDataAndLogs(id: string): Promise<ScrapeJob | null> {
    return this.findOne({
      where: { id, isDeleted: false },
      relations: ['scrapedData', 'scrapeLogs'],
      order: {
        'scrapedData.scrapedAt': 'DESC',
        'scrapeLogs.timestamp': 'DESC',
      },
    });
  },
});