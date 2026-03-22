```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create an Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // Create a regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
  });
  console.log(`Created regular user: ${regularUser.email}`);

  // Create some projects
  const projectAlpha = await prisma.project.upsert({
    where: { name_ownerId: { name: 'Project Alpha', ownerId: adminUser.id } },
    update: {},
    create: {
      name: 'Project Alpha',
      description: 'A critical project managed by the admin.',
      ownerId: adminUser.id,
      members: {
        connect: [{ id: adminUser.id }, { id: regularUser.id }],
      },
    },
  });
  console.log(`Created project: ${projectAlpha.name}`);

  const projectBeta = await prisma.project.upsert({
    where: { name_ownerId: { name: 'Project Beta', ownerId: regularUser.id } },
    update: {},
    create: {
      name: 'Project Beta',
      description: 'An internal project for the regular user.',
      ownerId: regularUser.id,
      members: {
        connect: [{ id: regularUser.id }],
      },
    },
  });
  console.log(`Created project: ${projectBeta.name}`);


  // Create some tasks for Project Alpha
  await prisma.task.upsert({
    where: { id: 'task-alpha-1' }, // Dummy ID for upsert, will generate new if not found
    update: {},
    create: {
      id: 'task-alpha-1',
      title: 'Setup initial project structure',
      description: 'Define folder structure, package.json, and basic config.',
      projectId: projectAlpha.id,
      creatorId: adminUser.id,
      assigneeId: adminUser.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });
  await prisma.task.upsert({
    where: { id: 'task-alpha-2' },
    update: {},
    create: {
      id: 'task-alpha-2',
      title: 'Implement User Authentication',
      description: 'Develop JWT-based authentication for user login and registration.',
      projectId: projectAlpha.id,
      creatorId: adminUser.id,
      assigneeId: regularUser.id,
      status: 'TODO',
      priority: 'URGENT',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });
  console.log(`Created tasks for ${projectAlpha.name}`);

  // Create a task for Project Beta
  await prisma.task.upsert({
    where: { id: 'task-beta-1' },
    update: {},
    create: {
      id: 'task-beta-1',
      title: 'Research new UI components',
      description: 'Explore libraries like Material-UI or Ant Design.',
      projectId: projectBeta.id,
      creatorId: regularUser.id,
      assigneeId: regularUser.id,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
  });
  console.log(`Created tasks for ${projectBeta.name}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seeding complete.');
  });
```