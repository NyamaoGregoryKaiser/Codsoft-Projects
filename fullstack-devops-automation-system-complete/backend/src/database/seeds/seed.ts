```typescript
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { UserRole } from '../../types/enums';
import logger from '../../utils/logger';

export const seed = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database initialized for seeding.');
    }

    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);
    const productRepository = AppDataSource.getRepository(Product);

    // Clear existing data (optional, useful for clean re-seeding)
    await productRepository.delete({});
    await categoryRepository.delete({});
    await userRepository.delete({});
    logger.info('Existing data cleared.');

    // 1. Create Users
    const adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'AdminPassword123!', // Hashing handled by BeforeInsert hook
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);

    const regularUser = userRepository.create({
      username: 'user',
      email: 'user@example.com',
      password: 'UserPassword123!',
      role: UserRole.USER,
    });
    await userRepository.save(regularUser);
    logger.info('Admin and regular users created.');

    // 2. Create Categories
    const electronics = categoryRepository.create({ name: 'Electronics' });
    await categoryRepository.save(electronics);

    const books = categoryRepository.create({ name: 'Books' });
    await categoryRepository.save(books);

    const homeGoods = categoryRepository.create({ name: 'Home Goods' });
    await categoryRepository.save(homeGoods);
    logger.info('Categories created.');

    // 3. Create Products
    const laptop = productRepository.create({
      name: 'Laptop Pro X',
      description: 'High-performance laptop for professionals.',
      price: 1299.99,
      stock: 50,
      category: electronics,
    });
    await productRepository.save(laptop);

    const smartphone = productRepository.create({
      name: 'Ultra Smartphone',
      description: 'Latest generation smartphone with advanced camera.',
      price: 899.00,
      stock: 120,
      category: electronics,
    });
    await productRepository.save(smartphone);

    const novel = productRepository.create({
      name: 'The Future of AI',
      description: 'An insightful book on artificial intelligence.',
      price: 25.50,
      stock: 200,
      category: books,
    });
    await productRepository.save(novel);

    const coffeeMaker = productRepository.create({
      name: 'Smart Coffee Maker',
      description: 'Brew your coffee remotely with this smart device.',
      price: 79.99,
      stock: 80,
      category: homeGoods,
    });
    await productRepository.save(coffeeMaker);

    const productNoCategory = productRepository.create({
        name: 'Mystery Item',
        description: 'A product without an assigned category.',
        price: 9.99,
        stock: 300,
        category: null,
    });
    await productRepository.save(productNoCategory);
    logger.info('Products created.');

    logger.info('Database seeding complete!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed after seeding.');
    }
  }
};

// If running as a standalone script
if (require.main === module) {
    seed();
}
```