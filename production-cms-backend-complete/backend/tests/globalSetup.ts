import { AppDataSource } from '../src/data-source';
import * as dotenv from 'dotenv';
import path from 'path';
import { logger } from '../src/config/logger';
import { User, UserRole } from '../src/entities/User';
import { Category } from '../src/entities/Category';
import { Content, ContentStatus } from '../src/entities/Content';

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Load .env for DB config
process.env.DB_DATABASE = 'test_cmsdb'; // Use a dedicated test database

module.exports = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  logger.info('Global setup: Clearing and seeding test database...');

  await AppDataSource.manager.clear(Content);
  await AppDataSource.manager.clear(Category);
  await AppDataSource.manager.clear(User);

  // Seed test data
  const adminUser = new User();
  adminUser.email = 'admin@test.com';
  adminUser.password = 'password123';
  adminUser.role = UserRole.ADMIN;
  await adminUser.hashPassword();
  await AppDataSource.manager.save(adminUser);

  const editorUser = new User();
  editorUser.email = 'editor@test.com';
  editorUser.password = 'password123';
  editorUser.role = UserRole.EDITOR;
  await editorUser.hashPassword();
  await AppDataSource.manager.save(editorUser);

  const viewerUser = new User();
  viewerUser.email = 'viewer@test.com';
  viewerUser.password = 'password123';
  viewerUser.role = UserRole.VIEWER;
  await viewerUser.hashPassword();
  await AppDataSource.manager.save(viewerUser);

  const testCategory = new Category();
  testCategory.name = 'Test Category';
  testCategory.description = 'Category for testing.';
  await AppDataSource.manager.save(testCategory);

  const testContent = new Content();
  testContent.title = 'Test Content Title';
  testContent.body = 'This is the body of the test content.';
  testContent.author = editorUser;
  testContent.category = testCategory;
  testContent.status = ContentStatus.PUBLISHED;
  await AppDataSource.manager.save(testContent);

  // Store seeded data for use in tests
  (global as any).__TEST_DATA__ = {
    adminUser,
    editorUser,
    viewerUser,
    testCategory,
    testContent,
  };

  logger.info('Test database seeded.');
};