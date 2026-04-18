import 'reflect-metadata';
import { AppDataSource } from '../../data-source';
import { Role } from '../../entities/Role';
import { User } from '../../entities/User';
import { Category } from '../../entities/Category';
import { Tag } from '../../entities/Tag';
import { Content, ContentStatus } from '../../entities/Content';
import { hashPassword } from '../../utils/auth';
import logger from '../../config/logger';

async function seedDatabase() {
  await AppDataSource.initialize();
  logger.info('Database connected for seeding.');

  const roleRepository = AppDataSource.getRepository(Role);
  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(Category);
  const tagRepository = AppDataSource.getRepository(Tag);
  const contentRepository = AppDataSource.getRepository(Content);

  try {
    // 1. Create Roles
    const adminRole = roleRepository.create({ name: 'admin', description: 'Administrator with full access' });
    const editorRole = roleRepository.create({ name: 'editor', description: 'Content editor with publishing rights' });
    const viewerRole = roleRepository.create({ name: 'viewer', description: 'Read-only access' });
    await roleRepository.save([adminRole, editorRole, viewerRole]);
    logger.info('Roles seeded.');

    // 2. Create Users
    const adminPassword = await hashPassword('AdminPass123!');
    const editorPassword = await hashPassword('EditorPass123!');

    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: adminRole,
    });

    const editorUser = userRepository.create({
      email: 'editor@example.com',
      password: editorPassword,
      firstName: 'Jane',
      lastName: 'Editor',
      role: editorRole,
    });
    await userRepository.save([adminUser, editorUser]);
    logger.info('Users seeded.');

    // 3. Create Categories
    const techCategory = categoryRepository.create({ name: 'Technology', slug: 'technology', description: 'Articles about tech and gadgets' });
    const lifestyleCategory = categoryRepository.create({ name: 'Lifestyle', slug: 'lifestyle', description: 'Tips for a better life' });
    await categoryRepository.save([techCategory, lifestyleCategory]);
    logger.info('Categories seeded.');

    // 4. Create Tags
    const programmingTag = tagRepository.create({ name: 'Programming', slug: 'programming' });
    const webdevTag = tagRepository.create({ name: 'Web Development', slug: 'web-development' });
    const healthTag = tagRepository.create({ name: 'Health', slug: 'health' });
    const wellnessTag = tagRepository.create({ name: 'Wellness', slug: 'wellness' });
    await tagRepository.save([programmingTag, webdevTag, healthTag, wellnessTag]);
    logger.info('Tags seeded.');

    // 5. Create Content
    const content1 = contentRepository.create({
      title: 'The Future of AI in Web Development',
      slug: 'future-ai-web-development',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      author: adminUser,
      category: techCategory,
      tags: [programmingTag, webdevTag],
    });

    const content2 = contentRepository.create({
      title: 'Mindfulness Practices for Daily Life',
      slug: 'mindfulness-daily-life',
      body: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // Published yesterday
      author: editorUser,
      category: lifestyleCategory,
      tags: [healthTag, wellnessTag],
    });

    const content3 = contentRepository.create({
      title: 'Draft Article: Getting Started with TypeScript',
      slug: 'draft-getting-started-typescript',
      body: 'This is a draft article, not yet ready for public consumption. It will cover the basics of TypeScript.',
      status: ContentStatus.DRAFT,
      author: editorUser,
      category: techCategory,
      tags: [programmingTag],
    });

    await contentRepository.save([content1, content2, content3]);
    logger.info('Content seeded.');

    logger.info('Database seeding complete!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    logger.info('Database connection closed.');
  }
}

seedDatabase();