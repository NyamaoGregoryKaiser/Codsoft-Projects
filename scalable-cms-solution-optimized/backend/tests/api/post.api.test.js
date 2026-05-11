const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Post, Category } = require('../../src/models');
const bcrypt = require('bcryptjs');
const config = require('../../src/config/config');
const jwt = require('jsonwebtoken');

describe('Post API Endpoints', () => {
  let server;
  let adminUser, editorUser, viewerUser;
  let adminToken, editorToken, viewerToken;
  let testCategory;
  let adminPost, editorPost, draftPost;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
    server = app.listen(0);

    // Create users
    adminUser = await User.create({
      username: 'adminpost', email: 'adminpost@example.com', password: await bcrypt.hash('adminpass', config.bcryptSaltRounds), role: 'admin', isActive: true,
    });
    editorUser = await User.create({
      username: 'editorpost', email: 'editorpost@example.com', password: await bcrypt.hash('editorpass', config.bcryptSaltRounds), role: 'editor', isActive: true,
    });
    viewerUser = await User.create({
      username: 'viewerpost', email: 'viewerpost@example.com', password: await bcrypt.hash('viewerpass', config.bcryptSaltRounds), role: 'viewer', isActive: true,
    });

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser.id }, config.jwtSecret, { expiresIn: '1h' });
    editorToken = jwt.sign({ id: editorUser.id }, config.jwtSecret, { expiresIn: '1h' });
    viewerToken = jwt.sign({ id: viewerUser.id }, config.jwtSecret, { expiresIn: '1h' });

    // Create a category
    testCategory = await Category.create({ name: 'Test Category', slug: 'test-category', description: 'For testing posts' });

    // Create posts
    adminPost = await Post.create({
      title: 'Admin Created Post', slug: 'admin-created-post', content: 'Content by admin', status: 'published', authorId: adminUser.id, categoryId: testCategory.id,
    });
    editorPost = await Post.create({
      title: 'Editor Created Post', slug: 'editor-created-post', content: 'Content by editor', status: 'published', authorId: editorUser.id, categoryId: testCategory.id,
    });
    draftPost = await Post.create({
      title: 'Draft Post', slug: 'draft-post', content: 'Draft content', status: 'draft', authorId: editorUser.id, categoryId: testCategory.id,
    });
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  // --- GET /api/posts ---
  describe('GET /api/posts', () => {
    it('should allow any authenticated user (viewer) to get all posts', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // adminPost, editorPost, draftPost
      expect(res.body.data.some(p => p.id === adminPost.id)).toBe(true);
      expect(res.body.data.some(p => p.id === editorPost.id)).toBe(true);
      expect(res.body.data.some(p => p.id === draftPost.id)).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/posts?page=1&limit=2')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/posts?status=draft')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(draftPost.id);
      expect(res.body.data[0].status).toBe('draft');
    });

    it('should filter by author', async () => {
      const res = await request(app)
        .get(`/api/posts?author=${adminUser.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(adminPost.id);
      expect(res.body.data[0].author.id).toBe(adminUser.id);
    });

    it('should include author and category details', async () => {
      const res = await request(app)
        .get(`/api/posts/${adminPost.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.author).toBeDefined();
      expect(res.body.post.author.username).toBe(adminUser.username);
      expect(res.body.post.author.email).toBe(adminUser.email);
      expect(res.body.post.author.password).toBeUndefined(); // Ensure password not included

      expect(res.body.post.category).toBeDefined();
      expect(res.body.post.category.name).toBe(testCategory.name);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/posts');

      expect(res.statusCode).toEqual(401);
    });
  });

  // --- GET /api/posts/:id ---
  describe('GET /api/posts/:id', () => {
    it('should get a post by ID for an authenticated user', async () => {
      const res = await request(app)
        .get(`/api/posts/${adminPost.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.id).toBe(adminPost.id);
      expect(res.body.post.title).toBe(adminPost.title);
    });

    it('should get a post by slug for an authenticated user', async () => {
      const res = await request(app)
        .get(`/api/posts/${editorPost.slug}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.id).toBe(editorPost.id);
      expect(res.body.post.slug).toBe(editorPost.slug);
    });

    it('should return 404 if post not found', async () => {
      const res = await request(app)
        .get('/api/posts/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Post with identifier 'non-existent-id' not found/);
    });
  });

  // --- POST /api/posts ---
  describe('POST /api/posts', () => {
    it('should allow admin to create a new post', async () => {
      const newPostData = {
        title: 'New Admin Post',
        slug: 'new-admin-post',
        content: 'Content from admin',
        status: 'published',
        categoryId: testCategory.id,
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPostData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post created successfully');
      expect(res.body.post).toHaveProperty('id');
      expect(res.body.post.title).toBe(newPostData.title);
      expect(res.body.post.authorId).toBe(adminUser.id); // Author is the admin
    });

    it('should allow editor to create a new post', async () => {
      const newPostData = {
        title: 'New Editor Post',
        content: 'Content from editor',
        status: 'draft',
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(newPostData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post created successfully');
      expect(res.body.post).toHaveProperty('id');
      expect(res.body.post.title).toBe(newPostData.title);
      expect(res.body.post.authorId).toBe(editorUser.id);
      expect(res.body.post.slug).toBe('new-editor-post'); // Auto-generated
    });

    it('should return 403 for viewer trying to create a post', async () => {
      const newPostData = {
        title: 'Viewer Post',
        content: 'Content by viewer',
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(newPostData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden: User role 'viewer' is not allowed to access this resource.");
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing Content' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Title and content are required to create a post.');
    });

    it('should return 409 if slug already exists', async () => {
      const newPostData = {
        title: 'Duplicate Slug Post',
        slug: adminPost.slug, // Existing slug
        content: 'Some content',
      };

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPostData);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(`Post with slug '${adminPost.slug}' already exists`);
    });
  });

  // --- PUT /api/posts/:id ---
  describe('PUT /api/posts/:id', () => {
    it('should allow admin to update any post', async () => {
      const updateData = { title: 'Admin Updated Post Title', status: 'archived' };
      const res = await request(app)
        .put(`/api/posts/${editorPost.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post updated successfully');
      expect(res.body.post.title).toBe(updateData.title);
      expect(res.body.post.status).toBe(updateData.status);
    });

    it('should allow editor to update their own published post', async () => {
      const updateData = { title: 'Editor Updated Own Post', excerpt: 'Updated summary' };
      const res = await request(app)
        .put(`/api/posts/${editorPost.id}`) // editorPost is owned by editorUser
        .set('Authorization', `Bearer ${editorToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.title).toBe(updateData.title);
      expect(res.body.post.excerpt).toBe(updateData.excerpt);
    });

    it('should allow editor to update someone else\'s draft post', async () => {
        const newEditor = await User.create({
            username: 'anotherEditor', email: 'another.editor@example.com', password: await bcrypt.hash('pass', config.bcryptSaltRounds), role: 'editor', isActive: true,
        });
        const anotherEditorToken = jwt.sign({ id: newEditor.id }, config.jwtSecret, { expiresIn: '1h' });

        const res = await request(app)
            .put(`/api/posts/${draftPost.id}`) // draftPost is owned by editorUser
            .set('Authorization', `Bearer ${anotherEditorToken}`)
            .send({ title: 'Reviewed Draft Title' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.post.title).toBe('Reviewed Draft Title');
        await newEditor.destroy();
    });

    it('should return 403 for editor updating someone else\'s published post', async () => {
      const res = await request(app)
        .put(`/api/posts/${adminPost.id}`) // adminPost is owned by adminUser
        .set('Authorization', `Bearer ${editorToken}`) // editorUser trying to update
        .send({ title: 'Attempted to Update Admin Post' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You are not authorized to edit this post.');
    });

    it('should return 403 for viewer updating any post', async () => {
      const res = await request(app)
        .put(`/api/posts/${adminPost.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Attempted to Update' });

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if post to update not found', async () => {
      const res = await request(app)
        .put('/api/posts/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Non Existent' });

      expect(res.statusCode).toEqual(404);
    });

    it('should return 409 if new slug already exists', async () => {
      const anotherPost = await Post.create({
        title: 'Another temporary post', slug: 'another-temp-post', content: 'content', status: 'draft', authorId: adminUser.id
      });
      const res = await request(app)
        .put(`/api/posts/${anotherPost.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: adminPost.slug }); // Attempt to use existing slug

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toMatch(`Post with slug '${adminPost.slug}' already exists`);
      await anotherPost.destroy();
    });

    it('should set publishedAt if status changes to published', async () => {
      const draftPostToPublish = await Post.create({
        title: 'Test Draft To Publish', slug: 'test-draft-to-publish', content: 'test', status: 'draft', authorId: editorUser.id, categoryId: testCategory.id, publishedAt: null
      });

      const res = await request(app)
        .put(`/api/posts/${draftPostToPublish.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'published' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.post.status).toBe('published');
      expect(res.body.post.publishedAt).not.toBeNull();
      expect(new Date(res.body.post.publishedAt).getTime()).toBeCloseTo(new Date().getTime(), -3000); // within 3 seconds
      await draftPostToPublish.destroy();
    });
  });

  // --- DELETE /api/posts/:id ---
  describe('DELETE /api/posts/:id', () => {
    it('should allow admin to delete any post', async () => {
      const postToDeleteByAdmin = await Post.create({
        title: 'Temp Post for Admin Delete', slug: 'temp-post-admin-delete', content: 'to be deleted', status: 'draft', authorId: editorUser.id, categoryId: testCategory.id,
      });

      const res = await request(app)
        .delete(`/api/posts/${postToDeleteByAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post deleted successfully');
      const deletedPost = await Post.findByPk(postToDeleteByAdmin.id);
      expect(deletedPost).toBeNull();
    });

    it('should allow editor to delete their own post', async () => {
      const postToDeleteByEditor = await Post.create({
        title: 'Temp Post for Editor Delete', slug: 'temp-post-editor-delete', content: 'to be deleted', status: 'draft', authorId: editorUser.id, categoryId: testCategory.id,
      });

      const res = await request(app)
        .delete(`/api/posts/${postToDeleteByEditor.id}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post deleted successfully');
      const deletedPost = await Post.findByPk(postToDeleteByEditor.id);
      expect(deletedPost).toBeNull();
    });

    it('should return 403 for editor deleting someone else\'s post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${adminPost.id}`) // adminPost owned by adminUser
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You are not authorized to delete this post.');
    });

    it('should return 403 for viewer deleting any post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${adminPost.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if post to delete not found', async () => {
      const res = await request(app)
        .delete('/api/posts/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});
```