import { DataSource } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../../ormconfig';
import { Comment } from '../../entities/comment.entity';
import { Role } from '../../common/enums/role.enum';

async function seed() {
  const dataSource = AppDataSource;
  await dataSource.initialize();

  try {
    console.log('Seeding database...');

    // Clear existing data (optional, useful for fresh seeds)
    await dataSource.manager.clear(Comment);
    await dataSource.manager.clear(Task);
    await dataSource.manager.clear(Project);
    await dataSource.manager.clear(User);

    const users: User[] = [];
    const projects: Project[] = [];
    const tasks: Task[] = [];
    const comments: Comment[] = [];

    // Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminUser = dataSource.manager.create(User, {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: passwordHash,
      role: Role.Admin,
    });
    await dataSource.manager.save(adminUser);
    users.push(adminUser);

    const regularUser = dataSource.manager.create(User, {
      username: 'john.doe',
      email: 'john.doe@example.com',
      passwordHash: passwordHash,
      role: Role.User,
    });
    await dataSource.manager.save(regularUser);
    users.push(regularUser);

    const janeUser = dataSource.manager.create(User, {
      username: 'jane.smith',
      email: 'jane.smith@example.com',
      passwordHash: passwordHash,
      role: Role.User,
    });
    await dataSource.manager.save(janeUser);
    users.push(janeUser);


    // Create Projects
    const project1 = dataSource.manager.create(Project, {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website for better UX.',
      owner: adminUser,
      status: 'active',
    });
    await dataSource.manager.save(project1);
    projects.push(project1);

    const project2 = dataSource.manager.create(Project, {
      name: 'Mobile App Development',
      description: 'Build a new mobile application for iOS and Android.',
      owner: regularUser,
      status: 'active',
    });
    await dataSource.manager.save(project2);
    projects.push(project2);

    const project3 = dataSource.manager.create(Project, {
      name: 'Internal Tools Optimization',
      description: 'Improve existing internal tools and workflows.',
      owner: adminUser,
      status: 'completed',
    });
    await dataSource.manager.save(project3);
    projects.push(project3);

    // Create Tasks
    const task1 = dataSource.manager.create(Task, {
      title: 'Design wireframes for homepage',
      description: 'Create low-fidelity wireframes for the new homepage layout.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      project: project1,
      assignee: janeUser,
      reporter: adminUser,
    });
    await dataSource.manager.save(task1);
    tasks.push(task1);

    const task2 = dataSource.manager.create(Task, {
      title: 'Develop user authentication module',
      description: 'Implement JWT-based user authentication for the mobile app.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      project: project2,
      assignee: regularUser,
      reporter: regularUser,
    });
    await dataSource.manager.save(task2);
    tasks.push(task2);

    const task3 = dataSource.manager.create(Task, {
      title: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      project: project1,
      assignee: adminUser,
      reporter: adminUser,
    });
    await dataSource.manager.save(task3);
    tasks.push(task3);

    const task4 = dataSource.manager.create(Task, {
      title: 'Refactor old codebase',
      description: 'Clean up and refactor legacy code in internal tools.',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      project: project3,
      assignee: adminUser,
      reporter: adminUser,
    });
    await dataSource.manager.save(task4);
    tasks.push(task4);

    // Create Comments
    const comment1 = dataSource.manager.create(Comment, {
      content: 'Initial thoughts on design direction. Focusing on minimalism.',
      task: task1,
      author: adminUser,
    });
    await dataSource.manager.save(comment1);
    comments.push(comment1);

    const comment2 = dataSource.manager.create(Comment, {
      content: 'User flow diagrams are ready for review.',
      task: task1,
      author: janeUser,
    });
    await dataSource.manager.save(comment2);
    comments.push(comment2);

    const comment3 = dataSource.manager.create(Comment, {
      content: 'Starting implementation next week. Need API specs finalized.',
      task: task2,
      author: regularUser,
    });
    await dataSource.manager.save(comment3);
    comments.push(comment3);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();