```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Adjust path as needed for local execution

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

  console.log('Seeding initial data...');

  // Hash admin password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Admin user created/updated: ${adminUser.email}`);

  // Example scraping job for the admin user
  const exampleJob = await prisma.scrapingJob.upsert({
    where: { id: 'clxk0g8n00000r55m88r10pEX' }, // A fixed ID for upsert
    update: {
      userId: adminUser.id,
      name: 'Example News Scraper',
      url: 'https://news.ycombinator.com/',
      cssSelectors: [
        { name: 'title', selector: '.titleline > a' },
        { name: 'url', selector: '.titleline > a@href' }, // @href to extract attribute
        { name: 'points', selector: '.subtext span.score' },
      ],
      cronSchedule: '0 * * * *', // Run every hour
      isActive: true,
    },
    create: {
      id: 'clxk0g8n00000r55m88r10pEX', // Ensure ID is set for consistent upsert
      userId: adminUser.id,
      name: 'Example News Scraper',
      url: 'https://news.ycombinator.com/',
      cssSelectors: [
        { name: 'title', selector: '.titleline > a' },
        { name: 'url', selector: '.titleline > a@href' },
        { name: 'points', selector: '.subtext span.score' },
      ],
      cronSchedule: '0 * * * *', // Run every hour
      isActive: true,
    },
  });

  console.log(`Example scraping job created/updated for admin: ${exampleJob.name}`);

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