import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a default admin user
  const adminEmail = 'admin@example.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('adminpassword123', 12);
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        passwordHash: hashedPassword,
      },
    });
    console.log(`Created admin user: ${adminUser.email}`);
  } else {
    console.log(`Admin user already exists: ${adminUser.email}`);
  }

  // Create a demo user
  const demoEmail = 'demo@example.com';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('demopassword123', 12);
    demoUser = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: demoEmail,
        passwordHash: hashedPassword,
      },
    });
    console.log(`Created demo user: ${demoUser.email}`);
  } else {
    console.log(`Demo user already exists: ${demoUser.email}`);
  }

  // Create a project for the demo user
  let demoProject = await prisma.project.findFirst({ where: { ownerId: demoUser.id } });
  let apiKey = '';

  if (!demoProject) {
    apiKey = crypto.randomBytes(32).toString('hex');
    demoProject = await prisma.project.create({
      data: {
        name: 'Demo Web App',
        apikey: apiKey,
        ownerId: demoUser.id,
      },
    });
    console.log(`Created demo project "${demoProject.name}" for ${demoUser.email} with API Key: ${apiKey}`);
  } else {
    apiKey = demoProject.apikey;
    console.log(`Demo project "${demoProject.name}" already exists for ${demoUser.email} with API Key: ${apiKey}`);
  }

  // Seed some dummy metrics for the demo project for the last 24 hours
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const metricsToCreate = 100;
  const metricsData = [];

  for (let i = 0; i < metricsToCreate; i++) {
    const timestamp = new Date(oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime()));

    // Simulate LCP values (ms)
    metricsData.push({
      projectId: demoProject.id,
      timestamp: timestamp,
      type: 'LCP',
      value: Math.round(Math.random() * (5000 - 500) + 500), // 500ms to 5000ms
      context: { url: `/page/${Math.floor(Math.random() * 5)}`, userAgent: 'Mozilla/5.0...' },
    });

    // Simulate FID values (ms)
    metricsData.push({
      projectId: demoProject.id,
      timestamp: timestamp,
      type: 'FID',
      value: Math.round(Math.random() * (300 - 10) + 10), // 10ms to 300ms
      context: { url: `/page/${Math.floor(Math.random() * 5)}`, interaction: 'click' },
    });

    // Simulate CLS values
    metricsData.push({
      projectId: demoProject.id,
      timestamp: timestamp,
      type: 'CLS',
      value: parseFloat((Math.random() * 0.5).toFixed(2)), // 0.0 to 0.5
      context: { url: `/page/${Math.floor(Math.random() * 5)}`, element: 'image' },
    });

    // Simulate API_RESPONSE times (ms)
    metricsData.push({
      projectId: demoProject.id,
      timestamp: timestamp,
      type: 'API_RESPONSE',
      value: Math.round(Math.random() * (1000 - 50) + 50), // 50ms to 1000ms
      context: { endpoint: `/api/data/${Math.floor(Math.random() * 3)}`, method: 'GET' },
    });

    // Simulate some errors
    if (Math.random() < 0.1) { // 10% chance of an error
      const errorTypes = ['TypeError', 'ReferenceError', 'NetworkError'];
      metricsData.push({
        projectId: demoProject.id,
        timestamp: timestamp,
        type: 'ERROR',
        value: 1, // Error count is typically 1
        context: {
          message: `${errorTypes[Math.floor(Math.random() * errorTypes.length)]}: Something went wrong.`,
          url: `/page/${Math.floor(Math.random() * 5)}`,
          stack: 'Error stack trace...',
        },
      });
    }
  }

  await prisma.metric.createMany({ data: metricsData });
  console.log(`Created ${metricsData.length} dummy metrics for project "${demoProject.name}"`);

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