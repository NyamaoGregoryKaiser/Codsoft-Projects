```typescript
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import logger from '../../utils/logger';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Comment } from '../entities/comment.entity';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Seeding database...');

    // Clear existing data (optional, for development purposes)
    await AppDataSource.manager.clear(Comment);
    await AppDataSource.manager.clear(Task);
    await AppDataSource.manager.clear(Project);
    await AppDataSource.manager.clear(User);
    logger.info('Cleared existing data.');

    // Create Admin User
    const adminUser = new User();
    adminUser.id = uuidv4();
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.email = 'admin@example.com';
    adminUser.password = 'password123'; // This will be hashed by the entity's pre-save hook
    adminUser.role = UserRole.ADMIN;
    await adminUser.hashPassword(); // Manually hash for seeding
    await AppDataSource.manager.save(adminUser);
    logger.info(`Created admin user: ${adminUser.email}`);

    // Create Member User
    const memberUser = new User();
    memberUser.id = uuidv4();
    memberUser.firstName = 'John';
    memberUser.lastName = 'Doe';
    memberUser.email = 'john.doe@example.com';
    memberUser.password = 'password123';
    memberUser.role = UserRole.MEMBER;
    await memberUser.hashPassword();
    await AppDataSource.manager.save(memberUser);
    logger.info(`Created member user: ${memberUser.email}`);

    // Create another Member User
    const janeUser = new User();
    janeUser.id = uuidv4();
    janeUser.firstName = 'Jane';
    janeUser.lastName = 'Smith';
    janeUser.email = 'jane.smith@example.com';
    janeUser.password = 'password123';
    janeUser.role = UserRole.MEMBER;
    await janeUser.hashPassword();
    await AppDataSource.manager.save(janeUser);
    logger.info(`Created member user: ${janeUser.email}`);

    // Create Projects
    const project1 = new Project();
    project1.id = uuidv4();
    project1.name = 'Website Redesign';
    project1.description = 'Redesign the company website with a modern look and improved UX.';
    project1.owner = adminUser;
    await AppDataSource.manager.save(project1);
    logger.info(`Created project: ${project1.name}`);

    const project2 = new Project();
    project2.id = uuidv4();
    project2.name = 'Mobile App Development';
    project2.description = 'Develop a new mobile application for iOS and Android.';
    project2.owner = memberUser;
    await AppDataSource.manager.save(project2);
    logger.info(`Created project: ${project2.name}`);

    // Create Tasks for Project 1
    const task1 = new Task();
    task1.id = uuidv4();
    task1.title = 'Design UI/UX Mockups';
    task1.description = 'Create wireframes and high-fidelity mockups for key website pages.';
    task1.status = TaskStatus.IN_PROGRESS;
    task1.priority = TaskPriority.HIGH;
    task1.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    task1.project = project1;
    task1.assignee = janeUser;
    await AppDataSource.manager.save(task1);
    logger.info(`Created task: ${task1.title}`);

    const task2 = new Task();
    task2.id = uuidv4();
    task2.title = 'Develop Frontend Components';
    task2.description = 'Implement reusable React components based on the design mockups.';
    task2.status = TaskStatus.TODO;
    task2.priority = TaskPriority.MEDIUM;
    task2.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    task2.project = project1;
    task2.assignee = memberUser;
    await AppDataSource.manager.save(task2);
    logger.info(`Created task: ${task2.title}`);

    const task3 = new Task();
    task3.id = uuidv4();
    task3.title = 'Setup Backend API Endpoints';
    task3.description = 'Create new API endpoints for user and task management.';
    task3.status = TaskStatus.DONE;
    task3.priority = TaskPriority.HIGH;
    task3.dueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    task3.project = project1;
    task3.assignee = adminUser;
    await AppDataSource.manager.save(task3);
    logger.info(`Created task: ${task3.title}`);

    // Create Tasks for Project 2
    const task4 = new Task();
    task4.id = uuidv4();
    task4.title = 'Define App Features';
    task4.description = 'List out all core features for the mobile application.';
    task4.status = TaskStatus.TODO;
    task4.priority = TaskPriority.HIGH;
    task4.dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    task4.project = project2;
    task4.assignee = adminUser;
    await AppDataSource.manager.save(task4);
    logger.info(`Created task: ${task4.title}`);

    // Create Comments
    const comment1 = new Comment();
    comment1.id = uuidv4();
    comment1.content = 'Looks good so far, make sure to consider accessibility.';
    comment1.user = adminUser;
    comment1.task = task1;
    await AppDataSource.manager.save(comment1);
    logger.info(`Added comment to task: ${task1.title}`);

    const comment2 = new Comment();
    comment2.id = uuidv4();
    comment2.content = 'I\'ll start working on this tomorrow.';
    comment2.user = memberUser;
    comment2.task = task2;
    await AppDataSource.manager.save(comment2);
    logger.info(`Added comment to task: ${task2.title}`);

    logger.info('Database seeding complete!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed.');
    }
  }
};

seedDatabase();
```