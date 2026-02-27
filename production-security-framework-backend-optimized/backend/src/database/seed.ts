```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import { TaskStatus } from '../tasks/enums/task-status.enum';
import { LoggerService } from '../common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  logger.log('Starting database seeding...');

  try {
    await dataSource.initialize(); // Ensure DataSource is initialized

    const userRepository = dataSource.getRepository(User);
    const projectRepository = dataSource.getRepository(Project);
    const taskRepository = dataSource.getRepository(Task);

    // Clear existing data
    logger.log('Clearing existing data...');
    await taskRepository.delete({});
    await projectRepository.delete({});
    await userRepository.delete({});
    logger.log('Existing data cleared.');

    // 1. Create Admin User
    const adminEmail = configService.get<string>('ADMIN_EMAIL') || 'admin@example.com';
    const adminPassword = configService.get<string>('ADMIN_PASSWORD') || 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = userRepository.create({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      roles: [UserRole.Admin],
    });
    await userRepository.save(admin);
    logger.log(`Created admin user: ${admin.email}`);

    // 2. Create Regular Users
    const user1 = userRepository.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: await bcrypt.hash('AlicePassword123!', 10),
      roles: [UserRole.User],
    });
    const user2 = userRepository.create({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: await bcrypt.hash('BobPassword123!', 10),
      roles: [UserRole.User],
    });
    await userRepository.save([user1, user2]);
    logger.log(`Created regular users: ${user1.email}, ${user2.email}`);

    // 3. Create Projects
    const project1 = projectRepository.create({
      title: 'Website Redesign',
      description: 'Redesign the company website for a modern look and better UX.',
      owner: user1,
    });
    const project2 = projectRepository.create({
      title: 'Mobile App Development',
      description: 'Develop a new mobile application for iOS and Android.',
      owner: user1,
    });
    const project3 = projectRepository.create({
      title: 'Backend API Optimization',
      description: 'Improve performance and security of existing backend services.',
      owner: user2,
    });
    const project4 = projectRepository.create({
      title: 'Marketing Campaign',
      description: 'Plan and execute a new digital marketing campaign.',
      owner: admin,
    });
    await projectRepository.save([project1, project2, project3, project4]);
    logger.log(`Created projects: ${project1.title}, ${project2.title}, ${project3.title}, ${project4.title}`);

    // 4. Create Tasks
    const task1 = taskRepository.create({
      title: 'Design wireframes',
      description: 'Create initial wireframes for new website layout.',
      status: TaskStatus.InProgress,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      project: project1,
      assignee: user1,
      creator: user1,
    });
    const task2 = taskRepository.create({
      title: 'Develop frontend components',
      description: 'Implement React components for the website.',
      status: TaskStatus.Open,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      project: project1,
      assignee: user2, // User 2 assigned to Alice's project
      creator: user1,
    });
    const task3 = taskRepository.create({
      title: 'Set up database schema',
      description: 'Define tables and relationships for mobile app backend.',
      status: TaskStatus.Done,
      project: project2,
      assignee: user1,
      creator: user1,
    });
    const task4 = taskRepository.create({
      title: 'Implement JWT authentication',
      description: 'Add secure JWT authentication to the backend API.',
      status: TaskStatus.Review,
      project: project3,
      assignee: bob,
      creator: bob,
    });
    const task5 = taskRepository.create({
      title: 'Create social media posts',
      description: 'Draft content for Facebook and Twitter posts.',
      status: TaskStatus.Open,
      project: project4,
      assignee: admin,
      creator: admin,
    });
    await taskRepository.save([task1, task2, task3, task4, task5]);
    logger.log(`Created tasks: ${task1.title}, ${task2.title}, ${task3.title}, ${task4.title}, ${task5.title}`);

    logger.log('Database seeding complete!');
  } catch (error) {
    logger.error('Database seeding failed:', error.message, 'SeedScript', error.stack);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  }
}

bootstrap();
```