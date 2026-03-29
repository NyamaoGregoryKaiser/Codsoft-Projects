```typescript
import { PrismaClient, UserRole, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/config'; // Import config for admin credentials

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Admin User
  const adminEmail = config.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = config.ADMIN_PASSWORD || 'adminpassword123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created/updated admin user with ID: ${admin.id}`);

  // 2. Create Regular User
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      password: await bcrypt.hash('password123', 12),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
    },
  });
  console.log(`Created/updated user: ${user1.id}`);

  // 3. Create Categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Gadgets, devices, and electronic accessories.',
      imageUrl: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Fiction, non-fiction, and educational books.',
      imageUrl: 'https://images.unsplash.com/photo-1532012197247-efd85c179c38?auto=format&fit=crop&q=80&w=2787&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Apparel for men, women, and children.',
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-f1c79462b48d?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  });

  console.log(`Created categories: ${electronics.name}, ${books.name}, ${clothing.name}`);

  // 4. Create Products
  const productsData = [
    {
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality sound with noise cancellation. Long-lasting battery.',
      price: 99.99,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06f2e2?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: electronics.id,
      status: ProductStatus.ACTIVE,
    },
    {
      name: '4K Smart LED TV',
      description: 'Experience stunning visuals with a smart operating system.',
      price: 499.99,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1593784991219-c09a888c381c?auto=format&fit=crop&q=80&w=2787&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: electronics.id,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'The Alchemist',
      description: 'A philosophical novel by Paulo Coelho about an Andalusian shepherd boy.',
      price: 12.50,
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd87?auto=format&fit=crop&q=80&w=2862&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: books.id,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Classic Denim Jacket',
      description: 'Timeless style denim jacket, perfect for any season.',
      price: 75.00,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1603252109350-2051679002b5?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: clothing.id,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Comfortable and supportive chair for long working hours.',
      price: 249.00,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1617260555776-e17f4d0d0c3a?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: electronics.id, // Or new 'Home & Office' category
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'JavaScript: The Good Parts',
      description: 'A classic guide to JavaScript programming by Douglas Crockford.',
      price: 25.00,
      stock: 0, // Out of stock example
      imageUrl: 'https://images.unsplash.com/photo-1555198038-f90b9e8a08d0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: books.id,
      status: ProductStatus.OUT_OF_STOCK,
    },
    {
      name: 'Summer T-Shirt',
      description: 'Lightweight cotton t-shirt for hot weather.',
      price: 19.99,
      stock: 200,
      imageUrl: 'https://images.unsplash.com/photo-1618349271617-e23e2b2c892b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: clothing.id,
      status: ProductStatus.ACTIVE,
    },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }
  console.log(`Created ${productsData.length} products.`);

  // 5. Create a Cart for user1 (if not already existing)
  await prisma.cart.upsert({
    where: { userId: user1.id },
    update: {},
    create: { userId: user1.id },
  });
  console.log(`Created cart for user: ${user1.id}`);


  // 6. Create Addresses for users
  const address1 = await prisma.address.upsert({
    where: {
      userId_street_city_state_zipCode: {
        userId: user1.id,
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      },
    },
    update: {},
    create: {
      userId: user1.id,
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
      isDefault: true,
    },
  });
  console.log(`Created address for user1: ${address1.id}`);


  // 7. Create some Reviews for products
  const productHeadphones = await prisma.product.findFirst({ where: { name: 'Wireless Bluetooth Headphones' } });
  if (productHeadphones) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: productHeadphones.id, userId: user1.id } },
      update: { rating: 5, comment: 'Excellent sound quality and comfortable!' },
      create: {
        productId: productHeadphones.id,
        userId: user1.id,
        rating: 5,
        comment: 'Excellent sound quality and comfortable! Highly recommend.',
      },
    });
    console.log(`Created review for product ${productHeadphones.id} by user ${user1.id}`);
  }

  const productTV = await prisma.product.findFirst({ where: { name: '4K Smart LED TV' } });
  if (productTV) {
    await prisma.review.create({
      data: {
        productId: productTV.id,
        userId: user1.id,
        rating: 4,
        comment: 'Great TV for the price, picture quality is amazing. Smart features are good.',
      },
    });
    console.log(`Created review for product ${productTV.id} by user ${user1.id}`);
  }


  console.log('Seeding finished.');
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