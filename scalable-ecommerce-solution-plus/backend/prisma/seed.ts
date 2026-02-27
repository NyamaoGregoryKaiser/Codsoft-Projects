import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: userPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });
  console.log('Created customer user:', customer.email);

  // Create Products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality sound with noise cancellation and long battery life.',
        price: 99.99,
        stock: 50,
        imageUrl: 'https://picsum.photos/seed/headphones/600/400',
        isActive: true,
      },
      {
        name: 'Smartwatch with Heart Rate Monitor',
        description: 'Track your fitness, notifications, and more on your wrist.',
        price: 149.99,
        stock: 30,
        imageUrl: 'https://picsum.photos/seed/smartwatch/600/400',
        isActive: true,
      },
      {
        name: 'Portable SSD 1TB',
        description: 'Blazing fast external storage for all your data needs.',
        price: 129.00,
        stock: 75,
        imageUrl: 'https://picsum.photos/seed/ssd/600/400',
        isActive: true,
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'Comfort and support for long hours at your desk.',
        price: 299.00,
        stock: 20,
        imageUrl: 'https://picsum.photos/seed/chair/600/400',
        isActive: true,
      },
      {
        name: '4K Ultra HD Smart TV 55 Inch',
        description: 'Immersive viewing experience with smart features.',
        price: 599.99,
        stock: 15,
        imageUrl: 'https://picsum.photos/seed/tv/600/400',
        isActive: true,
      },
    ],
    skipDuplicates: true, // Prevents errors if products already exist by name
  });
  console.log(`Created ${products.count} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });