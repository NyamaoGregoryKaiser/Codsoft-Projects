const postService = require('../../src/services/postService');
const { Post, User, Category } = require('../../src/models');
const { Op } = require('sequelize');
const { getCache, setCache, deleteCache, flushCache } = require('../../src/utils/cache');

// Mock all dependencies
jest.mock('../../src/models', () => ({
  Post: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  User: {},
  Category: {},
  Sequelize: { Op: {} }, // Mock Sequelize.Op, will be used by Op directly
}));
jest.mock('../../src/utils/cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  flushCache: jest.fn(),
}));

describe('Post Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPostData = {
    id: 'post-id-1',
    title: 'Test Post',
    slug: 'test-post',
    content: 'This is test content',
    status: 'published',
    authorId: 'author-id-1',
    categoryId: 'category-id-1',
    toJSON: jest.fn(() => ({
      id: 'post-id-1',
      title: 'Test Post',
      slug: 'test-post',
      content: 'This is test content',
      status: 'published',
      authorId: 'author-id-1',
      categoryId: 'category-id-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  const mockAuthor = { id: 'author-id-1', username: 'author', email: 'author@example.com' };
  const mockCategory = { id: 'category-id-1', name: 'Tech', slug: 'tech' };

  // --- getAllPosts Tests ---
  describe('getAllPosts', () => {
    it('should return cached data if available', async () => {
      const cachedResult = { data: [mockPostData], pagination: { total: 1 } };
      getCache.mockReturnValue(cachedResult);

      const result = await postService.getAllPosts(1, 10, {});

      expect(getCache).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(Post.findAndCountAll).not.toHaveBeenCalled();
    });

    it('should fetch all posts with pagination and filters and cache the result', async () => {
      getCache.mockReturnValue(undefined); // No cached data
      Post.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            ...mockPostData,
            author: mockAuthor,
            category: mockCategory
          }
        ],
      });

      const page = 1;
      const limit = 10;
      const filters = { status: 'published', search: 'Test' };
      const expectedWhere = {
        status: 'published',
        [Op.or]: [{ title: { [Op.iLike]: '%Test%' } }, { content: { [Op.iLike]: '%Test%' } }],
      };

      const result = await postService.getAllPosts(page, limit, filters);

      expect(Post.findAndCountAll).toHaveBeenCalledWith({
        where: expectedWhere,
        limit: limit,
        offset: (page - 1) * limit,
        order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        ],
      });
      expect(setCache).toHaveBeenCalled();
      expect(result.data.length).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should handle database errors when fetching all posts', async () => {
      getCache.mockReturnValue(undefined);
      Post.findAndCountAll.mockRejectedValue(new Error('DB Error'));

      await expect(postService.getAllPosts(1, 10, {})).rejects.toThrow('DB Error');
      expect(setCache).not.toHaveBeenCalled();
    });
  });

  // --- getPostByIdOrSlug Tests ---
  describe('getPostByIdOrSlug', () => {
    it('should return cached data if available', async () => {
      getCache.mockReturnValue(mockPostData);
      const result = await postService.getPostByIdOrSlug('test-post');
      expect(getCache).toHaveBeenCalledWith('post_detail:test-post');
      expect(result).toEqual(mockPostData);
      expect(Post.findOne).not.toHaveBeenCalled();
    });

    it('should fetch a post by ID and cache the result', async () => {
      getCache.mockReturnValue(undefined);
      Post.findOne.mockResolvedValue(mockPostData);

      const result = await postService.getPostByIdOrSlug('post-id-1');

      expect(Post.findOne).toHaveBeenCalledWith({
        where: { id: 'post-id-1' },
        include: expect.any(Array),
      });
      expect(setCache).toHaveBeenCalledWith('post_detail:post-id-1', mockPostData);
      expect(result).toEqual(mockPostData);
    });

    it('should fetch a post by slug and cache the result', async () => {
      getCache.mockReturnValue(undefined);
      Post.findOne.mockResolvedValue(mockPostData);

      const result = await postService.getPostByIdOrSlug('test-post');

      expect(Post.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        include: expect.any(Array),
      });
      expect(setCache).toHaveBeenCalledWith('post_detail:test-post', mockPostData);
      expect(result).toEqual(mockPostData);
    });

    it('should throw 404 if post not found', async () => {
      getCache.mockReturnValue(undefined);
      Post.findOne.mockResolvedValue(null);

      await expect(postService.getPostByIdOrSlug('non-existent')).rejects.toMatchObject({
        message: "Post with identifier 'non-existent' not found",
        statusCode: 404,
      });
    });
  });

  // --- createPost Tests ---
  describe('createPost', () => {
    it('should create a new post and invalidate cache', async () => {
      const newPostData = { title: 'New Post', content: 'New content' };
      const authorId = 'author-id-1';
      const createdPost = { ...mockPostData, id: 'new-post-id', ...newPostData, authorId, slug: 'new-post' };

      Post.findOne.mockResolvedValue(null); // No existing slug
      Post.create.mockResolvedValue(createdPost);

      const result = await postService.createPost(newPostData, authorId);

      expect(Post.create).toHaveBeenCalledWith({
        ...newPostData,
        slug: 'new-post', // Auto-generated
        authorId: authorId,
      });
      expect(flushCache).toHaveBeenCalled();
      expect(result).toEqual(createdPost);
    });

    it('should throw 409 if slug already exists', async () => {
      const newPostData = { title: 'Existing Post', content: 'Content', slug: 'existing-post' };
      const authorId = 'author-id-1';
      Post.findOne.mockResolvedValue({ id: 'some-other-id', slug: 'existing-post' }); // Slug exists

      await expect(postService.createPost(newPostData, authorId)).rejects.toMatchObject({
        message: "Post with slug 'existing-post' already exists",
        statusCode: 409,
      });
      expect(Post.create).not.toHaveBeenCalled();
      expect(flushCache).not.toHaveBeenCalled();
    });

    it('should generate slug if not provided', async () => {
      const newPostData = { title: 'Another Test Post', content: 'Some content' };
      const authorId = 'author-id-1';
      const createdPost = { ...mockPostData, id: 'new-post-id-2', ...newPostData, authorId, slug: 'another-test-post' };

      Post.findOne.mockResolvedValue(null);
      Post.create.mockResolvedValue(createdPost);

      await postService.createPost(newPostData, authorId);
      expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
        slug: 'another-test-post'
      }));
    });
  });

  // --- updatePost Tests ---
  describe('updatePost', () => {
    it('should update an existing post and invalidate cache', async () => {
      const postId = 'post-id-1';
      const updateData = { title: 'Updated Title', status: 'published' };
      const currentUserId = 'author-id-1';
      const currentUserRole = 'editor'; // Editor can update their own post

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: currentUserId, // simulate owning the post
        update: jest.fn().mockResolvedValue({ ...mockPostData, ...updateData }),
      });
      Post.findOne.mockResolvedValue(null); // No slug conflict

      const result = await postService.updatePost(postId, updateData, currentUserId, currentUserRole);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(result.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Title',
        status: 'published',
        publishedAt: expect.any(Date), // Should set publishedAt if status changes to published
      }));
      expect(deleteCache).toHaveBeenCalledWith('post_detail:post-id-1');
      expect(deleteCache).toHaveBeenCalledWith('post_detail:test-post'); // Old slug cache
      expect(flushCache).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw 404 if post to update not found', async () => {
      Post.findByPk.mockResolvedValue(null);

      await expect(postService.updatePost('non-existent', {}, 'user-id', 'admin')).rejects.toMatchObject({
        message: "Post with ID non-existent not found",
        statusCode: 404,
      });
    });

    it('should throw 403 if unauthorized to update', async () => {
      const postId = 'post-id-1';
      const updateData = { title: 'Updated Title' };
      const currentUserId = 'another-author';
      const currentUserRole = 'editor'; // Not admin, not the author

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: 'original-author', // Different author
        status: 'published' // Not a draft/archived
      });

      await expect(postService.updatePost(postId, updateData, currentUserId, currentUserRole)).rejects.toMatchObject({
        message: "You are not authorized to edit this post.",
        statusCode: 403,
      });
      expect(mockPostData.update).not.toHaveBeenCalled();
    });

    it('admin should be able to update any post', async () => {
      const postId = 'post-id-1';
      const updateData = { title: 'Admin Updated Title' };
      const currentUserId = 'admin-id';
      const currentUserRole = 'admin';

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: 'some-other-author', // Admin can edit anyone's post
        update: jest.fn().mockResolvedValue({ ...mockPostData, ...updateData }),
      });
      Post.findOne.mockResolvedValue(null);

      const result = await postService.updatePost(postId, updateData, currentUserId, currentUserRole);
      expect(result.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Admin Updated Title' }));
    });

    it('editor can update someone else\'s draft post', async () => {
      const postId = 'post-id-1';
      const updateData = { title: 'Editor Review Title' };
      const currentUserId = 'editor-reviewer-id';
      const currentUserRole = 'editor';

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: 'some-other-author', // Not the author
        status: 'draft', // But it's a draft
        update: jest.fn().mockResolvedValue({ ...mockPostData, ...updateData }),
      });
      Post.findOne.mockResolvedValue(null);

      const result = await postService.updatePost(postId, updateData, currentUserId, currentUserRole);
      expect(result.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Editor Review Title' }));
    });
  });

  // --- deletePost Tests ---
  describe('deletePost', () => {
    it('should delete a post and invalidate cache', async () => {
      const postId = 'post-id-1';
      const currentUserId = 'author-id-1';
      const currentUserRole = 'editor';

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: currentUserId, // user owns the post
        destroy: jest.fn().mockResolvedValue(1)
      });

      const result = await postService.deletePost(postId, currentUserId, currentUserRole);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(mockPostData.destroy).toHaveBeenCalled();
      expect(deleteCache).toHaveBeenCalledWith('post_detail:post-id-1');
      expect(deleteCache).toHaveBeenCalledWith('post_detail:test-post');
      expect(flushCache).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should throw 404 if post to delete not found', async () => {
      Post.findByPk.mockResolvedValue(null);

      await expect(postService.deletePost('non-existent', 'user-id', 'admin')).rejects.toMatchObject({
        message: "Post with ID non-existent not found",
        statusCode: 404,
      });
    });

    it('should throw 403 if unauthorized to delete', async () => {
      const postId = 'post-id-1';
      const currentUserId = 'another-user';
      const currentUserRole = 'editor'; // Not admin, not the author

      Post.findByPk.mockResolvedValue({
        ...mockPostData,
        authorId: 'original-author', // Different author
      });

      await expect(postService.deletePost(postId, currentUserId, currentUserRole)).rejects.toMatchObject({
        message: "You are not authorized to delete this post.",
        statusCode: 403,
      });
      expect(mockPostData.destroy).not.toHaveBeenCalled();
    });
  });
});
```