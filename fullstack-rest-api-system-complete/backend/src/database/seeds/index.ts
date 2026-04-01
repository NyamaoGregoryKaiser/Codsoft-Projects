import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../models/User.entity';
import { Project } from '../../models/Project.entity';
import { Task, TaskStatus, TaskPriority } from '../../models/Task.entity';
import { Comment } from '../../models/Comment.entity';
import { hashPassword } from '../../utils/password';
import logger from '../../utils/logger';

export const seedDatabase = async () => {
  await AppDataSource.initialize();
  logger.info('Seeding database...');

  const userRepository = AppDataSource.getRepository(User);
  const projectRepository = AppDataSource.getRepository(Project);
  const taskRepository = AppDataSource.getRepository(Task);
  const commentRepository = AppDataSource.getRepository(Comment);

  // Clear existing data (use with caution in production)
  await commentRepository.delete({});
  await taskRepository.delete({});
  await projectRepository.delete({});
  await userRepository.delete({});

  // Create Users
  const hashedPassword1 = await hashPassword('password123');
  const user1 = userRepository.create({
    email: 'john.doe@example.com',
    password: hashedPassword1,
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
  });
  await userRepository.save(user1);

  const hashedPassword2 = await hashPassword('admin123');
  const adminUser = userRepository.create({
    email: 'admin@example.com',
    password: hashedPassword2,
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  });
  await userRepository.save(adminUser);

  // Create Projects
  const project1 = projectRepository.create({
    name: 'Website Redesign',
    description: 'Redesign the company website for better UX and modern aesthetics.',
    owner: adminUser,
    startDate: new Date('2023-01-15'),
    endDate: new Date('2023-06-30'),
  });
  await projectRepository.save(project1);

  const project2 = projectRepository.create({
    name: 'Mobile App Development',
    description: 'Develop a new mobile application for iOS and Android.',
    owner: user1,
    startDate: new Date('2023-03-01'),
    endDate: new Date('2023-12-31'),
  });
  await projectRepository.save(project2);

  // Create Tasks
  const task1 = taskRepository.create({
    title: 'Design UI/UX Mockups',
    description: 'Create wireframes and high-fidelity mockups for the website.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2023-02-28'),
    project: project1,
    assignee: adminUser,
  });
  await taskRepository.save(task1);

  const task2 = taskRepository.create({
    title: 'Develop Backend API',
    description: 'Implement RESTful APIs for user and project management.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2023-05-15'),
    project: project1,
    assignee: user1,
  });
  await taskRepository.save(task2);

  const task3 = taskRepository.create({
    title: 'Set up Database',
    description: 'Configure PostgreSQL database and TypeORM entities.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2023-01-30'),
    project: project1,
    assignee: adminUser,
  });
  await taskRepository.save(task3);

  const task4 = taskRepository.create({
    title: 'Create Login Screen',
    description: 'Implement the login UI and connect to authentication API for mobile app.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2023-04-30'),
    project: project2,
    assignee: user1,
  });
  await taskRepository.save(task4);

  // Create Comments
  const comment1 = commentRepository.create({
    content: 'Initial thoughts on design, focusing on minimalism.',
    user: adminUser,
    task: task1,
  });
  await commentRepository.save(comment1);

  const comment2 = commentRepository.create({
    content: 'Waiting for design approval before starting implementation.',
    user: user1,
    task: task2,
  });
  await commentRepository.save(comment2);


  logger.info('Database seeded successfully!');
  await AppDataSource.destroy();
};

if (require.main === module) {
  seedDatabase().catch((error) => {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  });
}