import { AppDataSource } from '../ormconfig';
import { ScrapedData } from '../entities/ScrapedData';
import { Repository } from 'typeorm';

export const ScrapedDataRepository: Repository<ScrapedData> = AppDataSource.getRepository(ScrapedData).extend({
  findByJobId(jobId: string, limit: number = 100): Promise<ScrapedData[]> {
    return this.find({
      where: { jobId },
      order: { scrapedAt: 'DESC' },
      take: limit,
    });
  },
});