import { AppDataSource } from '..';
import { User, UserRole } from '../entities/User';
import { Task, TaskPriority, TaskStatus } from '../entities/Task';
import { hashPassword } from '../../shared/utils/password';
import { logger } from '../../config/logger';

export const initialSeed = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const taskRepository = AppDataSource.getRepository(Task);

  const existingAdmin = await userRepository.findOne({ where: { email: 'admin@example.com' } });

  if (!existingAdmin) {
    logger.info('Seeding initial admin user...');
    const adminUser = new User();
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.email = 'admin@example.com';
    adminUser.password = await hashPassword('adminPassword123');
    adminUser.role = UserRole.ADMIN;
    await userRepository.save(adminUser);
    logger.info('Admin user created.');

    const user1 = new User();
    user1.firstName = 'John';
    user1.lastName = 'Doe';
    user1.email = 'john.doe@example.com';
    user1.password = await hashPassword('johnPassword123');
    user1.role = UserRole.USER;
    await userRepository.save(user1);
    logger.info('User: John Doe created.');

    const user2 = new User();
    user2.firstName = 'Jane';
    user2.lastName = 'Smith';
    user2.email = 'jane.smith@example.com';
    user2.password = await hashPassword('janePassword123');
    user2.role = UserRole.USER;
    await userRepository.save(user2);
    logger.info('User: Jane Smith created.');

    // Seed some tasks
    const task1 = new Task();
    task1.title = 'Develop API Endpoints';
    task1.description = 'Implement CRUD operations for tasks and users.';
    task1.status = TaskStatus.IN_PROGRESS;
    task1.priority = TaskPriority.HIGH;
    task1.dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    task1.assignee = adminUser;
    await taskRepository.save(task1);

    const task2 = new Task();
    task2.title = 'Design Database Schema';
    task2.description = 'Define entities, relationships, and migrations.';
    task2.status = TaskStatus.COMPLETED;
    task2.priority = TaskPriority.HIGH;
    task2.dueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    task2.assignee = adminUser;
    await taskRepository.save(task2);

    const task3 = new Task();
    task3.title = 'Set up Frontend Project';
    task3.description = 'Configure React with TypeScript and basic styling.';
    task3.status = TaskStatus.PENDING;
    task3.priority = TaskPriority.MEDIUM;
    task3.dueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    task3.assignee = user1;
    await taskRepository.save(task3);

    const task4 = new Task();
    task4.title = 'Write Unit Tests';
    task4.description = 'Achieve 80%+ coverage for backend services.';
    task4.status = TaskStatus.IN_PROGRESS;
    task4.priority = TaskPriority.HIGH;
    task4.assignee = user1;
    await taskRepository.save(task4);

    const task5 = new Task();
    task5.title = 'Prepare Deployment Documentation';
    task5.description = 'Document Docker setup, CI/CD, and server provisioning.';
    task5.status = TaskStatus.PENDING;
    task5.priority = TaskPriority.LOW;
    task5.assignee = user2;
    await taskRepository.save(task5);

    logger.info('Initial tasks seeded.');
  } else {
    logger.info('Admin user already exists. Skipping initial seeding.');
  }
};