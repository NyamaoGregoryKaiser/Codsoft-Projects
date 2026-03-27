import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../modules/users/user.entity';
import { hashPassword } from '../../utils/password';
import config from '../../config';
import logger from '../../config/logger';

const seed = async () => {
  await AppDataSource.initialize();
  logger.info('Database connected for seeding...');

  try {
    const userRepository = AppDataSource.getRepository(User);

    // Create Admin User
    const adminUser = await userRepository.findOneBy({ email: config.adminUser.email });
    if (!adminUser) {
      const hashedPassword = await hashPassword(config.adminUser.password);
      const newAdmin = userRepository.create({
        username: config.adminUser.username,
        email: config.adminUser.email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(newAdmin);
      logger.info(`Admin user created: ${config.adminUser.email}`);
    } else {
      logger.info(`Admin user already exists: ${config.adminUser.email}`);
    }

    // You can add more seed data here, e.g., default projects, tasks, or other members.
    // For brevity, we'll only seed the admin user.

  } catch (error) {
    logger.error('Seeding failed:', error);
  } finally {
    await AppDataSource.destroy();
    logger.info('Database connection closed after seeding.');
  }
};

seed();