import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const HASH_SALT_ROUNDS = 10;

async function main() {
  console.log('Seeding database...');

  // Create an admin user
  const adminPassword = await bcrypt.hash('admin123', HASH_SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log(`Created/updated admin user with ID: ${adminUser.id}`);

  // Create a regular user
  const userPassword = await bcrypt.hash('user123', HASH_SALT_ROUNDS);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
    },
  });
  console.log(`Created/updated regular user with ID: ${regularUser.id}`);

  // Create tasks for the regular user
  await prisma.task.createMany({
    data: [
      {
        id: randomUUID(),
        title: 'Complete backend API',
        description: 'Implement all CRUD operations, auth, and error handling for tasks module.',
        status: 'IN_PROGRESS',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
        userId: regularUser.id,
      },
      {
        id: randomUUID(),
        title: 'Design database schema',
        description: 'Define models for users and tasks in Prisma.',
        status: 'COMPLETED',
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
        userId: regularUser.id,
      },
      {
        id: randomUUID(),
        title: 'Set up Docker environment',
        description: 'Create Dockerfile and docker-compose.yml for backend and PostgreSQL.',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
        userId: regularUser.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Created tasks for regular user ${regularUser.id}`);

  // Create a task for the admin user
  await prisma.task.createMany({
    data: [
      {
        id: randomUUID(),
        title: 'Review production logs',
        description: 'Check for any critical errors or warnings in the past 24 hours.',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), // 1 day from now
        userId: adminUser.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Created tasks for admin user ${adminUser.id}`);

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });