```javascript
'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const salt = await bcrypt.genSalt(10);

        // Seed Users
        const adminUserId = uuidv4();
        const authorUserId = uuidv4();

        await queryInterface.bulkInsert('users', [
            {
                id: adminUserId,
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('adminpassword', salt),
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: authorUserId,
                username: 'author',
                email: 'author@example.com',
                password: await bcrypt.hash('authorpassword', salt),
                role: 'author',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: uuidv4(),
                username: 'viewer',
                email: 'viewer@example.com',
                password: await bcrypt.hash('viewerpassword', salt),
                role: 'viewer',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        // Seed Categories
        const techCategoryId = uuidv4();
        const lifestyleCategoryId = uuidv4();

        await queryInterface.bulkInsert('categories', [
            {
                id: techCategoryId,
                name: 'Technology',
                slug: 'technology',
                description: 'Articles about latest tech trends and gadgets.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: lifestyleCategoryId,
                name: 'Lifestyle',
                slug: 'lifestyle',
                description: 'Tips and tricks for a better lifestyle.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        // Seed Tags
        const jsTagId = uuidv4();
        const nodejsTagId = uuidv4();
        const reactTagId = uuidv4();
        const healthTagId = uuidv4();
        const travelTagId = uuidv4();

        await queryInterface.bulkInsert('tags', [
            { id: jsTagId, name: 'JavaScript', slug: 'javascript', createdAt: new Date(), updatedAt: new Date() },
            { id: nodejsTagId, name: 'Node.js', slug: 'nodejs', createdAt: new Date(), updatedAt: new Date() },
            { id: reactTagId, name: 'React', slug: 'react', createdAt: new Date(), updatedAt: new Date() },
            { id: healthTagId, name: 'Health', slug: 'health', createdAt: new Date(), updatedAt: new Date() },
            { id: travelTagId, name: 'Travel', slug: 'travel', createdAt: new Date(), updatedAt: new Date() }
        ], {});

        // Seed Posts
        const firstPostId = uuidv4();
        const secondPostId = uuidv4();
        const thirdPostId = uuidv4();

        await queryInterface.bulkInsert('posts', [
            {
                id: firstPostId,
                title: 'Getting Started with Node.js and Express',
                slug: 'getting-started-nodejs-express',
                content: 'This is an introductory post on setting up a Node.js backend with Express. It covers basic routing, middleware, and project structure. Perfect for beginners.',
                excerpt: 'An introductory post on setting up a Node.js backend with Express...',
                status: 'published',
                featuredImage: null,
                publishedAt: new Date(),
                authorId: adminUserId,
                categoryId: techCategoryId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: secondPostId,
                title: 'The Benefits of a Healthy Diet',
                slug: 'benefits-healthy-diet',
                content: 'Eating a balanced diet has numerous benefits for your physical and mental health. Discover how to incorporate more nutrients into your daily meals.',
                excerpt: 'Eating a balanced diet has numerous benefits...',
                status: 'published',
                featuredImage: null,
                publishedAt: new Date(),
                authorId: authorUserId,
                categoryId: lifestyleCategoryId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: thirdPostId,
                title: 'Upcoming Features in React 18',
                slug: 'upcoming-features-react-18',
                content: 'React 18 introduced exciting features like Concurrent Mode, Suspense, and automatic batching. Learn how these will change the way you build UIs.',
                excerpt: 'React 18 introduced exciting features...',
                status: 'draft', // This post is a draft
                featuredImage: null,
                publishedAt: null,
                authorId: adminUserId,
                categoryId: techCategoryId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        // Seed PostTags (Many-to-Many associations)
        await queryInterface.bulkInsert('PostTags', [
            // First post: Node.js, JavaScript
            { postId: firstPostId, tagId: nodejsTagId, createdAt: new Date(), updatedAt: new Date() },
            { postId: firstPostId, tagId: jsTagId, createdAt: new Date(), updatedAt: new Date() },
            // Second post: Health
            { postId: secondPostId, tagId: healthTagId, createdAt: new Date(), updatedAt: new Date() },
            // Third post: React, JavaScript
            { postId: thirdPostId, tagId: reactTagId, createdAt: new Date(), updatedAt: new Date() },
            { postId: thirdPostId, tagId: jsTagId, createdAt: new Date(), updatedAt: new Date() }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        // Order of deletion matters due to foreign key constraints
        await queryInterface.bulkDelete('PostTags', null, {});
        await queryInterface.bulkDelete('posts', null, {});
        await queryInterface.bulkDelete('tags', null, {});
        await queryInterface.bulkDelete('categories', null, {});
        await queryInterface.bulkDelete('users', null, {});
    }
};
```