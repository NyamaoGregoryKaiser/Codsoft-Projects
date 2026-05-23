import 'reflect-metadata';
import { AppDataSource } from '../ormconfig';
import { User } from '../entities/User';
import { ScrapeJob } from '../entities/ScrapeJob';
import * as bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { UserRole, ScrapeJobStatus } from '../types/enums';

const seedDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database initialized for seeding.');
    }

    const userRepository = AppDataSource.getRepository(User);
    const scrapeJobRepository = AppDataSource.getRepository(ScrapeJob);

    // Clear existing data (optional, for development)
    await scrapeJobRepository.delete({});
    await userRepository.delete({});
    logger.info('Cleared existing data.');

    // Create Admin User
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);
    logger.info('Admin user created.');

    // Create Regular User
    const userPasswordHash = await bcrypt.hash('userpassword', 10);
    const regularUser = userRepository.create({
      email: 'user@example.com',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
    });
    await userRepository.save(regularUser);
    logger.info('Regular user created.');

    // Create Sample Scrape Jobs
    const job1 = scrapeJobRepository.create({
      user: regularUser,
      url: 'https://quotes.toscrape.com/',
      cssSelector: '.quote > .text',
      schedule: '0 * * * *', // Every hour
      status: ScrapeJobStatus.ACTIVE,
      nextRun: new Date(Date.now() + 60 * 60 * 1000), // Next hour
    });
    await scrapeJobRepository.save(job1);
    logger.info(`Sample scrape job 1 created for ${regularUser.email}`);

    const job2 = scrapeJobRepository.create({
      user: adminUser,
      url: 'http://books.toscrape.com/catalogue/category/books/travel_2/',
      cssSelector: '.product_pod h3 a',
      schedule: '0 0 * * *', // Every day at midnight
      status: ScrapeJobStatus.ACTIVE,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
    });
    await scrapeJobRepository.save(job2);
    logger.info(`Sample scrape job 2 created for ${adminUser.email}`);

    const job3 = scrapeJobRepository.create({
      user: regularUser,
      url: 'https://www.example.com',
      cssSelector: 'p',
      schedule: '*/5 * * * *', // Every 5 minutes (for testing scheduler)
      status: ScrapeJobStatus.PAUSED, // Start paused
    });
    await scrapeJobRepository.save(job3);
    logger.info(`Sample scrape job 3 created for ${regularUser.email} (paused)`);


    logger.info('Database seeding completed!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed after seeding.');
    }
  }
};

seedDatabase();