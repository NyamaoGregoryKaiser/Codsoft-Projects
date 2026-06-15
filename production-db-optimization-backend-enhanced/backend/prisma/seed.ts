import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create an admin user
  const adminPassword = await bcrypt.hash('adminpassword', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log({ adminUser });

  // Create a regular user
  const userPassword = await bcrypt.hash('userpassword', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
  });
  console.log({ regularUser });

  // Create a target database
  const prodDB = await prisma.targetDatabase.upsert({
    where: { name: 'Production DB' },
    update: {},
    create: {
      name: 'Production DB',
      type: 'PostgreSQL',
      description: 'Main production database for the core application.',
      ownerId: adminUser.id,
    },
  });
  console.log({ prodDB });

  const analyticsDB = await prisma.targetDatabase.upsert({
    where: { name: 'Analytics DB' },
    update: {},
    create: {
      name: 'Analytics DB',
      type: 'MongoDB',
      description: 'Database for storing analytical data.',
      ownerId: regularUser.id,
    },
  });
  console.log({ analyticsDB });

  // Create an analysis report
  const prodReport = await prisma.analysisReport.upsert({
    where: { title: 'Q1 2023 Prod DB Performance Analysis' },
    update: {},
    create: {
      title: 'Q1 2023 Prod DB Performance Analysis',
      description: 'Detailed analysis of slow queries and performance bottlenecks found in Q1 for Production DB.',
      targetDatabaseId: prodDB.id,
      analystId: adminUser.id,
      slowQueries: [
        { query: 'SELECT * FROM users WHERE email = $1', executionTimeMs: 150, count: 1200 },
        { query: 'SELECT count(*) FROM orders WHERE status = $1 AND createdAt > $2', executionTimeMs: 300, count: 500 },
      ],
    },
  });
  console.log({ prodReport });

  // Create recommendations
  await prisma.recommendation.upsert({
    where: { title: 'Index on users.email' },
    update: {},
    create: {
      title: 'Index on users.email',
      description: 'Add a B-tree index on the `email` column of the `users` table to optimize login and user lookup queries.',
      status: 'PENDING',
      priority: 2, // High
      analysisReportId: prodReport.id,
      targetDatabaseId: prodDB.id,
      recommendedById: adminUser.id,
      assignedToId: regularUser.id,
    },
  });

  await prisma.recommendation.upsert({
    where: { title: 'Optimize orders status and createdAt query' },
    update: {},
    create: {
      title: 'Optimize orders status and createdAt query',
      description: 'Create a composite index on `(status, createdAt)` for the `orders` table to improve performance of historical order status queries.',
      status: 'PENDING',
      priority: 1, // Medium
      analysisReportId: prodReport.id,
      targetDatabaseId: prodDB.id,
      recommendedById: adminUser.id,
    },
  });

  await prisma.recommendation.upsert({
    where: { title: 'Review unindexed foreign keys' },
    update: {},
    create: {
      title: 'Review unindexed foreign keys',
      description: 'Identify and create indexes for foreign keys to prevent deadlocks and improve join performance.',
      status: 'PENDING',
      priority: 1, // Medium
      analysisReportId: prodReport.id,
      targetDatabaseId: prodDB.id,
      recommendedById: adminUser.id,
    },
  });

  console.log('Seed data created successfully!');

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```