import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/User';
import { Category } from './entities/Category';
import { Content, ContentStatus } from './entities/Content';
import { logger } from './config/logger';
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seed = async () => {
    try {
        await AppDataSource.initialize();
        logger.info('Database connected for seeding.');

        // Clear existing data (optional, for development purposes)
        await AppDataSource.manager.clear(Content);
        await AppDataSource.manager.clear(Category);
        await AppDataSource.manager.clear(User);
        logger.info('Cleared existing data.');

        // Create Admin User
        const adminUser = new User();
        adminUser.email = 'admin@example.com';
        adminUser.password = 'password123'; // This will be hashed in the entity's save hook
        adminUser.role = UserRole.ADMIN;
        await adminUser.hashPassword(); // Manually hash before saving
        await AppDataSource.manager.save(adminUser);
        logger.info('Admin user created.');

        // Create Editor User
        const editorUser = new User();
        editorUser.email = 'editor@example.com';
        editorUser.password = 'password123';
        editorUser.role = UserRole.EDITOR;
        await editorUser.hashPassword();
        await AppDataSource.manager.save(editorUser);
        logger.info('Editor user created.');

        // Create Viewer User
        const viewerUser = new User();
        viewerUser.email = 'viewer@example.com';
        viewerUser.password = 'password123';
        viewerUser.role = UserRole.VIEWER;
        await viewerUser.hashPassword();
        await AppDataSource.manager.save(viewerUser);
        logger.info('Viewer user created.');

        // Create Categories
        const techCategory = new Category();
        techCategory.name = 'Technology';
        techCategory.description = 'Articles about software, hardware, and digital trends.';
        await AppDataSource.manager.save(techCategory);

        const healthCategory = new Category();
        healthCategory.name = 'Health & Wellness';
        healthCategory.description = 'Tips and information for a healthy lifestyle.';
        await AppDataSource.manager.save(healthCategory);

        const lifestyleCategory = new Category();
        lifestyleCategory.name = 'Lifestyle';
        lifestyleCategory.description = 'Content on daily living, hobbies, and culture.';
        await AppDataSource.manager.save(lifestyleCategory);
        logger.info('Categories created.');

        // Create Content
        const content1 = new Content();
        content1.title = 'The Future of AI in Content Creation';
        content1.body = 'Artificial intelligence is rapidly transforming how content is generated, optimized, and consumed. From writing assistance to personalized recommendations, AI tools are becoming indispensable for modern content creators. This article explores the latest advancements and ethical considerations.';
        content1.author = editorUser;
        content1.category = techCategory;
        content1.status = ContentStatus.PUBLISHED;
        content1.isFeatured = true;
        content1.thumbnailUrl = 'https://picsum.photos/seed/ai/800/600';
        await AppDataSource.manager.save(content1);

        const content2 = new Content();
        content2.title = 'Mindfulness Practices for Stress Reduction';
        content2.body = 'In a fast-paced world, finding moments of calm is crucial. Mindfulness, a practice of focusing on the present moment, offers numerous benefits for mental and physical health. Learn simple techniques to integrate mindfulness into your daily routine and reduce stress levels effectively.';
        content2.author = editorUser;
        content2.category = healthCategory;
        content2.status = ContentStatus.PUBLISHED;
        content2.thumbnailUrl = 'https://picsum.photos/seed/mindfulness/800/600';
        await AppDataSource.manager.save(content2);

        const content3 = new Content();
        content3.title = 'A Guide to Sustainable Living';
        content3.body = 'Sustainable living involves making choices that reduce your environmental impact. From adopting eco-friendly habits at home to supporting sustainable businesses, every step counts. This comprehensive guide provides practical tips for a greener lifestyle.';
        content3.author = editorUser;
        content3.category = lifestyleCategory;
        content3.status = ContentStatus.DRAFT; // This content is a draft
        content3.thumbnailUrl = 'https://picsum.photos/seed/sustainable/800/600';
        await AppDataSource.manager.save(content3);

        const content4 = new Content();
        content4.title = 'Understanding Web3 and Blockchain Technology';
        content4.body = 'Web3 represents the next generation of the internet, built on decentralized blockchain technology. It aims to empower users with greater control over their data and digital assets. Dive into the core concepts of Web3, NFTs, and cryptocurrencies.';
        content4.author = adminUser;
        content4.category = techCategory;
        content4.status = ContentStatus.PUBLISHED;
        content4.thumbnailUrl = 'https://picsum.photos/seed/web3/800/600';
        await AppDataSource.manager.save(content4);

        logger.info('Sample content created.');

        logger.info('Seeding completed successfully!');
    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
        logger.info('Database connection closed.');
    }
};

seed();