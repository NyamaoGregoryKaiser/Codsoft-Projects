```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../index';
import { User } from '../../modules/users/user.entity';
import { Project } from '../../modules/projects/project.entity';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';

// Seed function to insert initial data
async function seed() {
  await AppDataSource.initialize();
  logger.info('DataSource initialized for seeding.');

  const userRepository = AppDataSource.getRepository(User);
  const projectRepository = AppDataSource.getRepository(Project);

  // 1. Create a default admin user if not exists
  let adminUser = await userRepository.findOneBy({ email: 'admin@example.com' });
  if (!adminUser) {
    logger.info('Creating admin user...');
    const hashedPassword = await bcrypt.hash('adminpassword', 12);
    adminUser = userRepository.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });
    await userRepository.save(adminUser);
    logger.info(`Admin user created: ${adminUser.email}`);
  } else {
    logger.info(`Admin user already exists: ${adminUser.email}`);
  }

  // 2. Create a regular user if not exists
  let regularUser = await userRepository.findOneBy({ email: 'user@example.com' });
  if (!regularUser) {
    logger.info('Creating regular user...');
    const hashedPassword = await bcrypt.hash('userpassword', 12);
    regularUser = userRepository.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
    });
    await userRepository.save(regularUser);
    logger.info(`Regular user created: ${regularUser.email}`);
  } else {
    logger.info(`Regular user already exists: ${regularUser.email}`);
  }

  // 3. Create sample projects
  const adminProjectCount = await projectRepository.countBy({ owner: { id: adminUser.id } });
  if (adminProjectCount === 0) {
    logger.info('Creating sample projects for admin...');
    const project1 = projectRepository.create({
      name: 'Sales Forecasting',
      description: 'Predicting future sales based on historical data.',
      owner: adminUser,
    });
    const project2 = projectRepository.create({
      name: 'Customer Churn Prediction',
      description: 'Identifying customers likely to churn.',
      owner: adminUser,
    });
    await projectRepository.save([project1, project2]);
    logger.info('Sample projects created for admin.');
  } else {
    logger.info('Admin already has projects, skipping sample project creation.');
  }

  const userProjectCount = await projectRepository.countBy({ owner: { id: regularUser.id } });
  if (userProjectCount === 0) {
    logger.info('Creating sample projects for regular user...');
    const userProject = projectRepository.create({
      name: 'Fraud Detection',
      description: 'Developing models to detect fraudulent transactions.',
      owner: regularUser,
    });
    await projectRepository.save(userProject);
    logger.info('Sample projects created for regular user.');
  } else {
    logger.info('Regular user already has projects, skipping sample project creation.');
  }

  await AppDataSource.destroy();
  logger.info('Database seeding completed.');
}

seed().catch((error) => {
  logger.error('Error during database seeding:', error);
  process.exit(1);
});
```
*(To run seed: `ts-node src/database/seed/seed.ts` or `npm run seed`)*