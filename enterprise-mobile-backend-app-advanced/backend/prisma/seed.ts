import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data (optional, useful for clean re-seeding)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.token.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data.');

  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: UserRole.USER,
    },
  });
  console.log('Created admin and regular users.');

  const product1 = await prisma.product.create({
    data: {
      name: 'Laptop Pro',
      description: 'High performance laptop for professionals',
      price: new Decimal(1200.00),
      stock: 50,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Gaming Mouse',
      description: 'Ergonomic gaming mouse with customizable buttons',
      price: new Decimal(75.50),
      stock: 100,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with brown switches',
      price: new Decimal(150.00),
      stock: 70,
    },
  });
  console.log('Created products.');

  const order1 = await prisma.order.create({
    data: {
      userId: regularUser.id,
      totalAmount: new Decimal(1200.00),
      status: OrderStatus.PROCESSING,
      shippingAddress: '123 Main St, Anytown, USA',
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            priceAtOrder: product1.price,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: regularUser.id,
      totalAmount: new Decimal(75.50 * 2 + 150.00),
      status: OrderStatus.PENDING,
      shippingAddress: '456 Oak Ave, Somewhere, USA',
      items: {
        create: [
          {
            productId: product2.id,
            quantity: 2,
            priceAtOrder: product2.price,
          },
          {
            productId: product3.id,
            quantity: 1,
            priceAtOrder: product3.price,
          },
        ],
      },
    },
  });
  console.log('Created orders.');


  // Update product stock after initial orders to simulate purchase
  await prisma.product.update({ where: { id: product1.id }, data: { stock: product1.stock - 1 } });
  await prisma.product.update({ where: { id: product2.id }, data: { stock: product2.stock - 2 } });
  await prisma.product.update({ where: { id: product3.id }, data: { stock: product3.stock - 1 } });
  console.log('Updated product stock based on initial orders.');

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