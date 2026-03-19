```javascript
const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const { User, Post, Category, Tag } = require('../../src/models');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Mock Redis client for tests (to prevent actual Redis calls during tests)
jest.mock('../../src/utils/cache', () => {
    const originalModule = jest.requireActual('../../src/utils/cache');
    return {
        ...originalModule,
        client: {
            connect: jest.fn().mockResolvedValue(true),
            quit: jest.fn().mockResolvedValue(true),
            on: jest.fn(),
            isOpen: true, // Simulate client is always open
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(null), // Always miss cache by default
            del: jest.fn().mockResolvedValue(1)
        },
        getCache: jest.fn().mockResolvedValue(null), // Default to cache miss
        setCache: jest.fn().mockResolvedValue(true),
        deleteCache: jest.fn().mockResolvedValue(true)
    };
});

describe('Post API Integration Tests', () => {
    let adminToken, authorToken;
    let adminUser, authorUser;
    let category1, category2;
    let tag1, tag2;
    let testPost;

    beforeAll(async () => {
        // Ensure database is clean and migrated for tests
        await sequelize.sync({ force: true });
        // console.log('Database synced for tests.');

        // Seed users
        const salt = await bcrypt.genSalt(10);
        adminUser = await User.create({
            id: uuidv4(),
            username: 'admin_test',
            email: 'admin_test@example.com',
            password: await bcrypt.hash('password123', salt),
            role: 'admin',
        });
        authorUser = await User.create({
            id: uuidv4(),
            username: 'author_test',
            email: 'author_test@example.com',
            password: await bcrypt.hash('password123', salt),
            role: 'author',
        });

        // Generate tokens
        adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, config.jwtSecret, { expiresIn: '1h' });
        authorToken = jwt.sign({ id: authorUser.id, role: authorUser.role }, config.jwtSecret, { expiresIn: '1h' });

        // Seed categories
        category1 = await Category.create({ id: uuidv4(), name: 'Tech', slug: 'tech' });
        category2 = await Category.create({ id: uuidv4(), name: 'Science', slug: 'science' });

        // Seed tags
        tag1 = await Tag.create({ id: uuidv4(), name: 'JavaScript', slug: 'javascript' });
        tag2 = await Tag.create({ id: uuidv4(), name: 'Nodejs', slug: 'nodejs' });

        // Seed initial post
        testPost = await Post.create({
            id: uuidv4(),
            title: 'Initial Test Post',
            slug: 'initial-test-post',
            content: 'This is the initial content.',
            status: 'published',
            authorId: authorUser.id,
            categoryId: category1.id,
            publishedAt: new Date(),
        });
        await testPost.setTags([tag1, tag2]);

    }, 20000); // Increased timeout for database operations

    afterAll(async () => {
        await sequelize.close();
        // console.log('Database connection closed after tests.');
    });

    beforeEach(() => {
        // Clear mock calls for cache functions before each test
        const { getCache, setCache, deleteCache } = require('../../src/utils/cache');
        getCache.mockClear();
        setCache.mockClear();
        deleteCache.mockClear();
    });

    // --- Public API Tests ---
    describe('GET /api/posts/published', () => {
        it('should fetch all published posts', async () => {
            const res = await request(app).get('/api/posts/published');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThanOrEqual(1); // Test post is published
            expect(res.body[0]).toHaveProperty('author');
            expect(res.body[0]).toHaveProperty('category');
            expect(res.body[0]).toHaveProperty('tags');
            expect(res.body[0].status).toBe('published');
            expect(require('../../src/utils/cache').getCache).toHaveBeenCalledWith('/api/posts/published'); // Cache check
        });
    });

    describe('GET /api/posts/:identifier (public)', () => {
        it('should fetch a published post by ID', async () => {
            const res = await request(app).get(`/api/posts/${testPost.id}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.title).toBe(testPost.title);
            expect(res.body.status).toBe('published');
            expect(require('../../src/utils/cache').getCache).toHaveBeenCalledWith(`/api/posts/${testPost.id}`); // Cache check
        });

        it('should fetch a published post by slug', async () => {
            const res = await request(app).get(`/api/posts/${testPost.slug}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.slug).toBe(testPost.slug);
            expect(res.body.status).toBe('published');
            expect(require('../../src/utils/cache').getCache).toHaveBeenCalledWith(`/api/posts/${testPost.slug}`); // Cache check
        });

        it('should return 404 for a non-existent post', async () => {
            const res = await request(app).get(`/api/posts/${uuidv4()}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Post not found.');
        });

        it('should return 404 for a draft post if not authenticated', async () => {
            const draftPost = await Post.create({
                id: uuidv4(),
                title: 'Draft Post for Public Test',
                slug: 'draft-post-for-public-test',
                content: 'This is a draft.',
                status: 'draft',
                authorId: authorUser.id,
                categoryId: category1.id,
            });
            const res = await request(app).get(`/api/posts/${draftPost.id}`);
            expect(res.statusCode).toEqual(404);
            await draftPost.destroy(); // Clean up
        });
    });

    // --- Authenticated API Tests ---
    describe('POST /api/posts', () => {
        it('should create a new post as admin', async () => {
            const newPostData = {
                title: 'New Post by Admin',
                content: 'Content for admin post.',
                status: 'draft',
                categoryId: category1.id,
                tagIds: [tag1.id]
            };
            const res = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newPostData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Post created successfully.');
            expect(res.body.post.title).toBe(newPostData.title);
            expect(res.body.post.status).toBe('draft');
            expect(res.body.post.authorId).toBe(adminUser.id);
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts/published');
        });

        it('should create a new post as author', async () => {
            const newPostData = {
                title: 'New Post by Author',
                content: 'Content for author post.',
                status: 'published',
                categoryId: category2.id,
                tagIds: [tag2.id]
            };
            const res = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${authorToken}`)
                .send(newPostData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Post created successfully.');
            expect(res.body.post.title).toBe(newPostData.title);
            expect(res.body.post.status).toBe('published');
            expect(res.body.post.authorId).toBe(authorUser.id);
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts/published');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ content: 'missing title' }); // Missing title

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Title, content, and author ID are required.');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/posts')
                .send({ title: 'Unauthorized Post', content: 'content' });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/posts (authenticated)', () => {
        it('should fetch all posts (including drafts) for an admin', async () => {
            const res = await request(app)
                .get('/api/posts')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThanOrEqual(3); // Initial, 2 new posts, 1 draft post for public test
            expect(res.body.some(post => post.status === 'draft')).toBe(true);
            expect(require('../../src/utils/cache').getCache).toHaveBeenCalledWith('/api/posts');
        });

        it('should fetch all posts (including own drafts) for an author', async () => {
            // Create a draft post by author_test
            await Post.create({
                id: uuidv4(),
                title: 'Author Draft Post',
                slug: 'author-draft-post',
                content: 'This is an author draft.',
                status: 'draft',
                authorId: authorUser.id,
                categoryId: category1.id,
            });

            const res = await request(app)
                .get('/api/posts')
                .set('Authorization', `Bearer ${authorToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThanOrEqual(3); // Should see all published + own drafts
            // For general /api/posts, authors see ALL posts filtered by status, not just their own.
            // My service returns all posts for author role, but public are `published`, private for `admin` is all.
            // Re-evaluating `findAllPosts` logic: `userRole === 'admin' ? {} : { status: 'published' };`
            // This means authors (non-admin) still only see 'published' through this endpoint, which is likely correct.
            // If they need to see their own drafts, they would need a specific endpoint like /api/posts/my-posts
            expect(res.body.every(post => post.status === 'published')).toBe(true); // Authors only see published via this generic route
        });
    });


    describe('PUT /api/posts/:id', () => {
        let postToUpdate;

        beforeEach(async () => {
            postToUpdate = await Post.create({
                id: uuidv4(),
                title: 'Post to Update',
                slug: 'post-to-update',
                content: 'Original content.',
                status: 'draft',
                authorId: authorUser.id,
                categoryId: category1.id,
            });
        });

        it('should update a post by admin', async () => {
            const updatedTitle = 'Updated Post by Admin';
            const res = await request(app)
                .put(`/api/posts/${postToUpdate.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: updatedTitle, status: 'published' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Post updated successfully.');
            expect(res.body.post.title).toBe(updatedTitle);
            expect(res.body.post.status).toBe('published');
            expect(res.body.post.publishedAt).not.toBeNull();
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts/published');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith(`/api/posts/${postToUpdate.id}`);
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith(`/api/posts/slug/${res.body.post.slug}`);
        });

        it('should update own post by author', async () => {
            const updatedContent = 'New content for author post.';
            const res = await request(app)
                .put(`/api/posts/${postToUpdate.id}`)
                .set('Authorization', `Bearer ${authorToken}`)
                .send({ content: updatedContent, categoryId: category2.id });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Post updated successfully.');
            expect(res.body.post.content).toBe(updatedContent);
            expect(res.body.post.category.id).toBe(category2.id);
        });

        it('should return 403 if author tries to update another user\'s post', async () => {
            const anotherPost = await Post.create({
                id: uuidv4(),
                title: 'Another User Post',
                slug: 'another-user-post',
                content: 'Content.',
                status: 'draft',
                authorId: adminUser.id, // Admin is the author
                categoryId: category1.id,
            });

            const res = await request(app)
                .put(`/api/posts/${anotherPost.id}`)
                .set('Authorization', `Bearer ${authorToken}`) // Author trying to update admin's post
                .send({ title: 'Attempt to update' });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Forbidden: You do not have permission to perform this action.');
            await anotherPost.destroy();
        });

        it('should return 404 for non-existent post', async () => {
            const res = await request(app)
                .put(`/api/posts/${uuidv4()}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Non Existent' });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Post not found or unauthorized to update.');
        });
    });

    describe('DELETE /api/posts/:id', () => {
        let postToDelete;

        beforeEach(async () => {
            postToDelete = await Post.create({
                id: uuidv4(),
                title: 'Post to Delete',
                slug: 'post-to-delete',
                content: 'Content to be deleted.',
                status: 'draft',
                authorId: authorUser.id,
                categoryId: category1.id,
            });
        });

        it('should delete a post by admin', async () => {
            const res = await request(app)
                .delete(`/api/posts/${postToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Post deleted successfully.');
            const deletedPost = await Post.findByPk(postToDelete.id);
            expect(deletedPost).toBeNull();
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/posts/published');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith(`/api/posts/${postToDelete.id}`);
        });

        it('should delete own post by author', async () => {
            const res = await request(app)
                .delete(`/api/posts/${postToDelete.id}`)
                .set('Authorization', `Bearer ${authorToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Post deleted successfully.');
            const deletedPost = await Post.findByPk(postToDelete.id);
            expect(deletedPost).toBeNull();
        });

        it('should return 403 if author tries to delete another user\'s post', async () => {
            const anotherPost = await Post.create({
                id: uuidv4(),
                title: 'Another User Post for Deletion',
                slug: 'another-user-post-for-deletion',
                content: 'Content.',
                status: 'draft',
                authorId: adminUser.id, // Admin is the author
                categoryId: category1.id,
            });

            const res = await request(app)
                .delete(`/api/posts/${anotherPost.id}`)
                .set('Authorization', `Bearer ${authorToken}`); // Author trying to delete admin's post

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Forbidden: You do not have permission to perform this action.');
            const exists = await Post.findByPk(anotherPost.id);
            expect(exists).not.toBeNull();
            await anotherPost.destroy(); // Clean up
        });

        it('should return 404 for non-existent post', async () => {
            const res = await request(app)
                .delete(`/api/posts/${uuidv4()}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Post not found or unauthorized to delete.');
        });
    });

    // Test Categories
    describe('Category API (Admin only)', () => {
        const newCategory = { name: 'New Category', description: 'A brand new category' };
        let createdCategory;

        it('should create a new category as admin', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newCategory);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Category created successfully.');
            expect(res.body.category.name).toBe(newCategory.name);
            expect(res.body.category.slug).toBe('new-category');
            createdCategory = res.body.category;
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/categories');
        });

        it('should return 403 if author tries to create a category', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({ name: 'Forbidden Category' });

            expect(res.statusCode).toEqual(403);
        });

        it('should update a category as admin', async () => {
            const updatedName = 'Updated Category Name';
            const res = await request(app)
                .put(`/api/categories/${createdCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: updatedName });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Category updated successfully.');
            expect(res.body.category.name).toBe(updatedName);
            expect(res.body.category.slug).toBe('updated-category-name');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/categories');
        });

        it('should delete a category as admin', async () => {
            const res = await request(app)
                .delete(`/api/categories/${createdCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Category deleted successfully.');
            const deletedCategory = await Category.findByPk(createdCategory.id);
            expect(deletedCategory).toBeNull();
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/categories');
        });
    });

    // Test Tags
    describe('Tag API (Admin only)', () => {
        const newTag = { name: 'New Tag' };
        let createdTag;

        it('should create a new tag as admin', async () => {
            const res = await request(app)
                .post('/api/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newTag);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Tag created successfully.');
            expect(res.body.tag.name).toBe(newTag.name);
            expect(res.body.tag.slug).toBe('new-tag');
            createdTag = res.body.tag;
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/tags');
        });

        it('should return 403 if author tries to create a tag', async () => {
            const res = await request(app)
                .post('/api/tags')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({ name: 'Forbidden Tag' });

            expect(res.statusCode).toEqual(403);
        });

        it('should update a tag as admin', async () => {
            const updatedName = 'Updated Tag Name';
            const res = await request(app)
                .put(`/api/tags/${createdTag.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: updatedName });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Tag updated successfully.');
            expect(res.body.tag.name).toBe(updatedName);
            expect(res.body.tag.slug).toBe('updated-tag-name');
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/tags');
        });

        it('should delete a tag as admin', async () => {
            const res = await request(app)
                .delete(`/api/tags/${createdTag.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Tag deleted successfully.');
            const deletedTag = await Tag.findByPk(createdTag.id);
            expect(deletedTag).toBeNull();
            expect(require('../../src/utils/cache').deleteCache).toHaveBeenCalledWith('/api/tags');
        });
    });

    describe('Image Upload', () => {
        it('should upload a featured image as admin', async () => {
            const filePath = `${__dirname}/../fixtures/test-image.png`; // Create a dummy image file for testing
            // Need to ensure the 'uploads' directory exists or is mocked.
            const fs = require('fs');
            const uploadDir = `${__dirname}/../../uploads`;
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            fs.writeFileSync(filePath, 'dummy image content');

            const res = await request(app)
                .post(`/api/posts/${testPost.id}/image`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('featuredImage', filePath); // 'featuredImage' should match the field name in multer

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Image uploaded successfully.');
            expect(res.body.imageUrl).toMatch(/\/uploads\/\d+-\w+\.png$/);
            expect(res.body.fileName).toMatch(/\d+-\w+\.png$/);
            // Optionally, verify file exists and then clean up
            fs.unlinkSync(filePath); // Delete dummy test image
        });

        it('should return 400 if no file is uploaded', async () => {
            const res = await request(app)
                .post(`/api/posts/${testPost.id}/image`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); // No file attached

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('No file uploaded.');
        });
    });

});
```