```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create an admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created/updated:', admin.email);

  // Create a regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log('Regular user created/updated:', user.email);

  // Create some products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality sound with noise cancellation and comfortable earcups.',
        price: 99.99,
        imageUrl: 'https://via.placeholder.com/300x200/FF5733/FFFFFF?text=Headphones',
        category: 'Electronics',
        brand: 'AudioTech',
        stock: 50,
      },
      {
        name: 'Smartwatch with Heart Rate Monitor',
        description: 'Track your fitness, notifications, and calls on your wrist.',
        price: 149.99,
        imageUrl: 'https://via.placeholder.com/300x200/3366FF/FFFFFF?text=Smartwatch',
        category: 'Electronics',
        brand: 'WearableX',
        stock: 30,
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'Designed for comfort and support during long working hours.',
        price: 249.00,
        imageUrl: 'https://via.placeholder.com/300x200/33FF57/FFFFFF?text=Office+Chair',
        category: 'Furniture',
        brand: 'ComfortZone',
        stock: 20,
      },
      {
        name: '4K Ultra HD Smart TV',
        description: 'Immersive viewing experience with stunning clarity and smart features.',
        price: 799.00,
        imageUrl: 'https://via.placeholder.com/300x200/FF33CC/FFFFFF?text=Smart+TV',
        category: 'Electronics',
        brand: 'ViewSonic',
        stock: 15,
      },
      {
        name: 'Stainless Steel Coffee Maker',
        description: 'Brew delicious coffee at home with this sleek and durable machine.',
        price: 75.50,
        imageUrl: 'https://via.placeholder.com/300x200/CCFF33/FFFFFF?text=Coffee+Maker',
        category: 'Home Appliances',
        brand: 'BrewMaster',
        stock: 40,
      },
      {
        name: 'Gaming Laptop - High Performance',
        description: 'Powerful laptop for serious gamers, with latest GPU and CPU.',
        price: 1800.00,
        imageUrl: 'https://via.placeholder.com/300x200/5733FF/FFFFFF?text=Gaming+Laptop',
        category: 'Electronics',
        brand: 'GamePro',
        stock: 10,
      },
    ],
    skipDuplicates: true, // Prevents errors if products already exist by unique constraints (e.g. name if made unique)
  });
  console.log(`Created ${products.count} products`);

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