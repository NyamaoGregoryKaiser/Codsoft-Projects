import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../../../ormconfig'; // Adjust path as needed
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Role } from '../enums/roles.enum';
import { TaskStatus } from '../enums/task-status.enum';

async function seedDatabase(dataSource: DataSource) {
  await dataSource.initialize();
  console.log('Database initialized for seeding...');

  // Clear existing data (optional, use with caution in production)
  // await dataSource.manager.clear(Comment);
  // await dataSource.manager.clear(Task);
  // await dataSource.manager.clear(Tag);
  // await dataSource.manager.clear(Project);
  // await dataSource.manager.clear(User);

  const userRepository = dataSource.getRepository(User);
  const projectRepository = dataSource.getRepository(Project);
  const taskRepository = dataSource.getRepository(Task);
  const tagRepository = dataSource.getRepository(Tag);
  const commentRepository = dataSource.getRepository(Comment);

  // 1. Create Users
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('password456', 10);

  const user1 = userRepository.create({
    username: 'john_doe',
    email: 'john@example.com',
    password: hashedPassword1,
    roles: [Role.User],
  });
  const user2 = userRepository.create({
    username: 'jane_smith',
    email: 'jane@example.com',
    password: hashedPassword2,
    roles: [Role.User, Role.Admin], // Jane is an admin
  });
  const adminUser = userRepository.create({
    username: 'admin',
    email: 'admin@example.com',
    password: await bcrypt.hash('adminpassword', 10),
    roles: [Role.Admin],
  });

  await userRepository.save([user1, user2, adminUser]);
  console.log('Users seeded.');

  // 2. Create Projects
  const project1 = projectRepository.create({
    name: 'Website Redesign',
    description: 'Redesigning the company website for better UI/UX.',
    owner: user1,
    ownerId: user1.id,
  });
  const project2 = projectRepository.create({
    name: 'Mobile App Development',
    description: 'Developing a new mobile application for iOS and Android.',
    owner: user1,
    ownerId: user1.id,
  });
  const project3 = projectRepository.create({
    name: 'Marketing Campaign Launch',
    description: 'Plan and execute new marketing strategies.',
    owner: user2,
    ownerId: user2.id,
  });

  await projectRepository.save([project1, project2, project3]);
  console.log('Projects seeded.');

  // 3. Create Tags
  const tagFrontend = tagRepository.create({ name: 'frontend', color: '#007bff' });
  const tagBackend = tagRepository.create({ name: 'backend', color: '#28a745' });
  const tagDesign = tagRepository.create({ name: 'design', color: '#ffc107' });
  const tagUrgent = tagRepository.create({ name: 'urgent', color: '#dc3545' });
  const tagBug = tagRepository.create({ name: 'bug', color: '#6f42c1' });

  await tagRepository.save([tagFrontend, tagBackend, tagDesign, tagUrgent, tagBug]);
  console.log('Tags seeded.');

  // 4. Create Tasks
  const task1 = taskRepository.create({
    title: 'Design Home Page UI',
    description: 'Create mockups and wireframes for the new home page.',
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    project: project1,
    projectId: project1.id,
    assignee: user1,
    assigneeId: user1.id,
    tags: [tagDesign, tagFrontend],
  });

  const task2 = taskRepository.create({
    title: 'Implement User Authentication API',
    description: 'Develop secure user registration and login endpoints.',
    status: TaskStatus.TODO,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
    project: project1,
    projectId: project1.id,
    assignee: user2,
    assigneeId: user2.id,
    tags: [tagBackend, tagUrgent],
  });

  const task3 = taskRepository.create({
    title: 'Develop iOS App Splash Screen',
    description: 'Implement the initial loading screen for the mobile app.',
    status: TaskStatus.DONE,
    project: project2,
    projectId: project2.id,
    assignee: user1,
    assigneeId: user1.id,
    tags: [tagDesign],
  });

  const task4 = taskRepository.create({
    title: 'Write Blog Post for Launch',
    description: 'Prepare content for the website redesign announcement.',
    status: TaskStatus.TODO,
    project: project3,
    projectId: project3.id,
    assignee: user2,
    assigneeId: user2.id,
    tags: [],
  });

  await taskRepository.save([task1, task2, task3, task4]);
  console.log('Tasks seeded.');

  // 5. Create Comments
  const comment1 = commentRepository.create({
    content: 'Initial design mockups are ready for review.',
    author: user1,
    authorId: user1.id,
    task: task1,
    taskId: task1.id,
  });

  const comment2 = commentRepository.create({
    content: 'Please prioritize the authentication module due to security concerns.',
    author: user2,
    authorId: user2.id,
    task: task2,
    taskId: task2.id,
  });

  await commentRepository.save([comment1, comment2]);
  console.log('Comments seeded.');

  await dataSource.destroy();
  console.log('Seeding complete.');
}

seedDatabase(AppDataSource).catch(error => console.error('Seeding failed:', error));