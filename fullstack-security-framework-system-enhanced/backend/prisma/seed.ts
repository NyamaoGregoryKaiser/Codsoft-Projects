import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRoles } from '../src/constants/roles';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRoles.ADMIN,
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: UserRoles.USER,
    },
  });
  console.log(`Created regular user: ${regularUser.email}`);

  // Create some products
  const product1 = await prisma.product.upsert({
    where: { id: 'prod1' }, // Using a fixed ID for upsert; in real world, this might be dynamic or based on unique name
    update: {
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals.',
      price: 1200.00,
      stock: 50,
    },
    create: {
      id: 'prod1',
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals.',
      price: 1200.00,
      stock: 50,
      createdById: adminUser.id,
    },
  });
  console.log(`Created product: ${product1.name}`);

  const product2 = await prisma.product.upsert({
    where: { id: 'prod2' },
    update: {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with long battery life.',
      price: 25.99,
      stock: 200,
    },
    create: {
      id: 'prod2',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with long battery life.',
      price: 25.99,
      stock: 200,
      createdById: regularUser.id,
    },
  });
  console.log(`Created product: ${product2.name}`);

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