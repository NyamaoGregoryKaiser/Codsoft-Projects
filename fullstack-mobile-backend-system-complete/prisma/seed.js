```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminHashedPassword = await bcrypt.hash('adminpassword123', 10);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user with ID: ${adminUser.id}`);

  // Create a regular User
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });
  console.log(`Created regular user with ID: ${regularUser.id}`);

  // Create Projects
  const project1 = await prisma.project.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' }, // Fixed ID for idempotent seeding
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Mobile App Development',
      description: 'Develop a new mobile application for project management.',
      ownerId: adminUser.id,
      status: 'IN_PROGRESS',
    },
  });
  console.log(`Created project with ID: ${project1.id}`);

  const project2 = await prisma.project.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Website Redesign',
      description: 'Redesign the company website with a modern look and feel.',
      ownerId: regularUser.id,
      status: 'PENDING',
    },
  });
  console.log(`Created project with ID: ${project2.id}`);

  // Create Tasks for Project 1
  await prisma.task.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      title: 'Design UI/UX Mockups',
      description: 'Create wireframes and high-fidelity mockups for the app.',
      projectId: project1.id,
      assignedToId: regularUser.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    },
  });

  await prisma.task.upsert({
    where: { id: '00000000-0000-4000-8000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000004',
      title: 'Implement User Authentication',
      description: 'Set up JWT, refresh tokens, and password hashing.',
      projectId: project1.id,
      assignedToId: adminUser.id,
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
    },
  });

  await prisma.task.upsert({
    where: { id: '00000000-0000-4000-8000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000005',
      title: 'Database Schema Definition',
      description: 'Define Prisma models and relationships for project and task management.',
      projectId: project1.id,
      assignedToId: adminUser.id,
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago
    },
  });
  console.log('Created tasks for project 1');

  // Create Tasks for Project 2
  await prisma.task.upsert({
    where: { id: '00000000-0000-4000-8000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000006',
      title: 'Competitor Analysis',
      description: 'Research competitor websites for design inspiration and features.',
      projectId: project2.id,
      assignedToId: regularUser.id,
      status: 'TODO',
      priority: 'MEDIUM',
    },
  });
  console.log('Created tasks for project 2');

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```