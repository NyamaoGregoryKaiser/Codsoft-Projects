import { AppDataSource } from '..';
import { User, UserRole } from '../entities/User.entity';
import { Product } from '../entities/Product.entity';
import { Category } from '../entities/Category.entity';
import { Cart } from '../entities/Cart.entity';
import { CartItem } from '../entities/CartItem.entity';
import { logger } from '../../config/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  await AppDataSource.initialize();
  logger.info('Database connected for seeding.');

  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Product);
  const categoryRepository = AppDataSource.getRepository(Category);
  const cartRepository = AppDataSource.getRepository(Cart);
  const cartItemRepository = AppDataSource.getRepository(CartItem);

  // Clear existing data (for development/testing)
  logger.info('Clearing existing data...');
  await cartItemRepository.delete({});
  await cartRepository.delete({});
  await productRepository.delete({}); // Deletes product_categories too due to cascade
  await categoryRepository.delete({});
  await userRepository.delete({});
  logger.info('Data cleared.');

  // Create Users
  logger.info('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = userRepository.create({
    email: 'admin@example.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  });
  await userRepository.save(adminUser);

  const regularUser = userRepository.create({
    email: 'user@example.com',
    password: hashedPassword,
    firstName: 'Regular',
    lastName: 'User',
    role: UserRole.USER,
  });
  await userRepository.save(regularUser);
  logger.info('Users created.');

  // Create Categories
  logger.info('Creating categories...');
  const electronicsCategory = categoryRepository.create({
    name: 'Electronics',
    description: 'Gadgets and electronic devices',
  });
  await categoryRepository.save(electronicsCategory);

  const apparelCategory = categoryRepository.create({
    name: 'Apparel',
    description: 'Clothing and fashion items',
  });
  await categoryRepository.save(apparelCategory);
  logger.info('Categories created.');

  // Create Products
  logger.info('Creating products...');
  const product1 = productRepository.create({
    name: 'Smartphone X',
    description: 'A powerful smartphone with advanced features.',
    price: 699.99,
    stock: 50,
    imageUrl: 'https://example.com/smartphone_x.jpg',
    categories: [electronicsCategory],
  });
  await productRepository.save(product1);

  const product2 = productRepository.create({
    name: 'Wireless Headphones',
    description: 'High-fidelity audio with noise cancellation.',
    price: 199.99,
    stock: 100,
    imageUrl: 'https://example.com/headphones.jpg',
    categories: [electronicsCategory],
  });
  await productRepository.save(product2);

  const product3 = productRepository.create({
    name: 'T-Shirt Pro',
    description: 'Comfortable cotton t-shirt for everyday wear.',
    price: 25.00,
    stock: 200,
    imageUrl: 'https://example.com/tshirt_pro.jpg',
    categories: [apparelCategory],
  });
  await productRepository.save(product3);
  logger.info('Products created.');

  // Create Carts for users
  logger.info('Creating carts...');
  const userCart = cartRepository.create({ user: regularUser });
  await cartRepository.save(userCart);
  regularUser.cart = userCart;
  await userRepository.save(regularUser); // Update user with cart reference

  // Add items to user's cart
  const cartItem1 = cartItemRepository.create({
    cart: userCart,
    product: product1,
    quantity: 1,
  });
  await cartItemRepository.save(cartItem1);

  const cartItem2 = cartItemRepository.create({
    cart: userCart,
    product: product3,
    quantity: 2,
  });
  await cartItemRepository.save(cartItem2);
  logger.info('Carts and cart items created.');

  logger.info('Database seeding completed!');
  await AppDataSource.destroy();
};

seedDatabase().catch((error) => {
  logger.error('Database seeding failed:', error);
  process.exit(1);
});