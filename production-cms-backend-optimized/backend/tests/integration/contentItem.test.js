```javascript
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, models } = require('../../src/db');
const { User, Role, Permission, ContentType, ContentItem } = models;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { v4: uuidv4 } = require('uuid');

// Use a separate test database
process.env.NODE_ENV = 'test';

describe('Content Item API Integration Tests', () => {
  let adminUser, authorUser, adminToken, authorToken, postContentType, pageContentType;

  beforeAll(async () => {
    // Connect to test database and synchronize (force creates tables)
    await sequelize.sync({ force: true });

    // Create roles
    const adminRole = await Role.create({ id: uuidv4(), name: 'Admin', slug: 'admin', description: 'Admin' });
    const authorRole = await Role.create({ id: uuidv4(), name: 'Author', slug: 'author', description: 'Author' });
    const editorRole = await Role.create({ id: uuidv4(), name: 'Editor', slug: 'editor', description: 'Editor' });

    // Create permissions
    const readContentItemsPerm = await Permission.create({ id: uuidv4(), name: 'Read Content Items', slug: 'read_content_items' });
    const createContentItemsPerm = await Permission.create({ id: uuidv4(), name: 'Create Content Items', slug: 'create_content_items' });
    const updateContentItemsPerm = await Permission.create({ id: uuidv4(), name: 'Update Content Items', slug: 'update_content_items' });
    const deleteContentItemsPerm = await Permission.create({ id: uuidv4(), name: 'Delete Content Items', slug: 'delete_content_items' });
    const manageContentTypesPerm = await Permission.create({ id: uuidv4(), name: 'Manage Content Types', slug: 'manage_content_types' });

    // Assign permissions to roles
    await adminRole.addPermissions([
      readContentItemsPerm, createContentItemsPerm, updateContentItemsPerm, deleteContentItemsPerm, manageContentTypesPerm
    ]);
    await authorRole.addPermissions([readContentItemsPerm, createContentItemsPerm]);
    await editorRole.addPermissions([readContentItemsPerm, createContentItemsPerm, updateContentItemsPerm, deleteContentItemsPerm]);


    // Create users
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    adminUser = await User.create({
      id: uuidv4(),
      username: 'admin_test',
      email: 'admin_test@example.com',
      password: hashedPassword,
      roleId: adminRole.id,
    });
    authorUser = await User.create({
      id: uuidv4(),
      username: 'author_test',
      email: 'author_test@example.com',
      password: hashedPassword,
      roleId: authorRole.id,
    });

    // Generate JWT tokens
    adminToken = jwt.sign({ id: adminUser.id, roleId: adminRole.id, roleName: adminRole.name }, config.jwtSecret, { expiresIn: '1h' });
    authorToken = jwt.sign({ id: authorUser.id, roleId: authorRole.id, roleName: authorRole.name }, config.jwtSecret, { expiresIn: '1h' });

    // Create content types
    postContentType = await ContentType.create({
      id: uuidv4(),
      name: 'Test Post',
      slug: 'test-post',
      description: 'A content type for testing posts',
      fields: [
        { name: 'title', label: 'Title', type: 'string', required: true },
        { name: 'body', label: 'Body', type: 'text', required: true },
        { name: 'tags', label: 'Tags', type: 'json', required: false, defaultValue: [] },
      ],
    });

    pageContentType = await ContentType.create({
      id: uuidv4(),
      name: 'Test Page',
      slug: 'test-page',
      description: 'A content type for testing pages',
      fields: [
        { name: 'pageTitle', label: 'Page Title', type: 'string', required: true },
        { name: 'pageContent', label: 'Page Content', type: 'text', required: true },
      ],
    });
  });

  afterAll(async () => {
    // Close the database connection
    await sequelize.close();
  });

  describe('GET /api/content-items', () => {
    it('should return all content items for admin user', async () => {
      // Create some content items
      await ContentItem.create({
        id: uuidv4(),
        contentTypeId: postContentType.id,
        data: { title: 'Post 1', body: 'Content 1' },
        status: 'published',
        authorId: adminUser.id,
      });
      await ContentItem.create({
        id: uuidv4(),
        contentTypeId: pageContentType.id,
        data: { pageTitle: 'Page A', pageContent: 'Page Content A' },
        status: 'draft',
        authorId: authorUser.id,
      });

      const res = await request(app)
        .get('/api/content-items')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.rows).toBeInstanceOf(Array);
      expect(res.body.rows.length).toBeGreaterThanOrEqual(2);
      expect(res.body.rows[0]).toHaveProperty('id');
      expect(res.body.rows[0]).toHaveProperty('ContentType');
      expect(res.body.rows[0].ContentType.name).toBeDefined();
    });

    it('should return content items filtered by contentTypeId', async () => {
      const res = await request(app)
        .get(`/api/content-items?contentTypeId=${postContentType.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.rows).toBeInstanceOf(Array);
      expect(res.body.rows.every(item => item.contentTypeId === postContentType.id)).toBe(true);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/content-items');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token provided');
    });

    it('should return 403 if user does not have read_content_items permission', async () => {
      // Create a user without read_content_items permission
      const userWithoutPermRole = await Role.create({ id: uuidv4(), name: 'NoContentRead', slug: 'no-content-read' });
      const userWithoutPerm = await User.create({
        id: uuidv4(),
        username: 'no_read_user',
        email: 'noread@example.com',
        password: await bcrypt.hash('Test@123', 10),
        roleId: userWithoutPermRole.id,
      });
      const token = jwt.sign({ id: userWithoutPerm.id, roleId: userWithoutPermRole.id, roleName: userWithoutPermRole.name }, config.jwtSecret, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/content-items')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Forbidden: You do not have the necessary permissions to perform this action.');
    });
  });

  describe('POST /api/content-items', () => {
    it('should create a new content item successfully for admin', async () => {
      const newItemData = {
        contentTypeId: postContentType.id,
        data: { title: 'New Post Title', body: 'New post content here.' },
        status: 'draft',
      };

      const res = await request(app)
        .post('/api/content-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItemData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.data.title).toBe('New Post Title');
      expect(res.body.status).toBe('draft');
      expect(res.body.authorId).toBe(adminUser.id);
    });

    it('should create a new content item successfully for author', async () => {
      const newItemData = {
        contentTypeId: postContentType.id,
        data: { title: 'Author Post Title', body: 'Author post content here.' },
        status: 'draft',
      };

      const res = await request(app)
        .post('/api/content-items')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(newItemData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.data.title).toBe('Author Post Title');
      expect(res.body.status).toBe('draft');
      expect(res.body.authorId).toBe(authorUser.id);
    });

    it('should return 400 if content type ID is invalid', async () => {
      const newItemData = {
        contentTypeId: 'invalid-uuid',
        data: { title: 'Bad Post', body: 'Bad content' },
      };

      const res = await request(app)
        .post('/api/content-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItemData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Content Type ID must be a valid UUID.');
    });

    it('should return 400 if content data does not match content type schema', async () => {
      const newItemData = {
        contentTypeId: postContentType.id,
        data: { title: 'Post with missing body' }, // 'body' is required
      };

      const res = await request(app)
        .post('/api/content-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItemData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Content data validation failed: "Body" is required');
    });
  });

  describe('PUT /api/content-items/:id', () => {
    let contentItemToUpdate;

    beforeEach(async () => {
      contentItemToUpdate = await ContentItem.create({
        id: uuidv4(),
        contentTypeId: postContentType.id,
        data: { title: 'Original Title', body: 'Original body content.' },
        status: 'draft',
        authorId: adminUser.id,
      });
    });

    it('should update an existing content item successfully', async () => {
      const updatedData = {
        data: { title: 'Updated Title', tags: ['updated', 'test'] },
        status: 'published',
      };

      const res = await request(app)
        .put(`/api/content-items/${contentItemToUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(contentItemToUpdate.id);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.body).toBe('Original body content.'); // Ensure other fields are merged
      expect(res.body.data.tags).toEqual(['updated', 'test']);
      expect(res.body.status).toBe('published');
      expect(res.body.updatedBy).toBe(adminUser.id);
      expect(res.body.publishedAt).not.toBeNull();
    });

    it('should return 404 if content item not found', async () => {
      const res = await request(app)
        .put(`/api/content-items/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: { title: 'Nonexistent' } });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Content item not found');
    });

    it('should return 400 if updated data does not match content type schema', async () => {
      const updatedData = {
        data: { title: 123 }, // Title should be string, not number
      };

      const res = await request(app)
        .put(`/api/content-items/${contentItemToUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Content data validation failed: "Title" must be a string');
    });
  });

  describe('DELETE /api/content-items/:id', () => {
    let contentItemToDelete;

    beforeEach(async () => {
      contentItemToDelete = await ContentItem.create({
        id: uuidv4(),
        contentTypeId: postContentType.id,
        data: { title: 'Ephemeral Post', body: 'This will be deleted.' },
        status: 'draft',
        authorId: adminUser.id,
      });
    });

    it('should delete a content item successfully', async () => {
      const res = await request(app)
        .delete(`/api/content-items/${contentItemToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204); // No content
      const foundItem = await ContentItem.findByPk(contentItemToDelete.id);
      expect(foundItem).toBeNull();
    });

    it('should return 404 if content item not found', async () => {
      const res = await request(app)
        .delete(`/api/content-items/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Content item not found');
    });
  });
});
```