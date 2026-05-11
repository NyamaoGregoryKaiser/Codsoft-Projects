const postService = require('../services/postService');
const logger = require('../utils/logger');

/**
 * Retrieves all posts with pagination and optional filters.
 * Accessible by 'admin', 'editor', 'viewer'. Viewers might only see published posts.
 * For this example, anyone authenticated can see all posts they have access to (based on role logic in service).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      status: req.query.status,
      categoryId: req.query.category,
      authorId: req.query.author,
      search: req.query.search
    };

    const posts = await postService.getAllPosts(page, limit, filters);

    res.status(200).json({
      success: true,
      data: posts.data,
      pagination: posts.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single post by ID or slug.
 * Accessible by 'admin', 'editor', 'viewer'.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const getPostByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params; // 'id' can be actual ID or slug

    const post = await postService.getPostByIdOrSlug(id);

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new post.
 * Accessible by 'admin', 'editor'.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content, slug, excerpt, status, featuredImage, categoryId } = req.body;
    const authorId = req.user.id; // Get author from authenticated user

    if (!title || !content) {
      const error = new Error('Title and content are required to create a post.');
      error.statusCode = 400;
      throw error;
    }

    const newPost = await postService.createPost(
      { title, content, slug, excerpt, status, featuredImage, categoryId },
      authorId
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: newPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing post.
 * Accessible by 'admin', 'editor' (with specific conditions).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No update data provided.');
      error.statusCode = 400;
      throw error;
    }

    // Prevent direct update of 'id', 'authorId', 'createdAt', 'updatedAt'
    delete updateData.id;
    delete updateData.authorId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedPost = await postService.updatePost(id, updateData, currentUserId, currentUserRole);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a post.
 * Accessible by 'admin', 'editor' (with specific conditions).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const deletedCount = await postService.deletePost(id, currentUserId, currentUserRole);

    if (deletedCount === 0) {
      const error = new Error(`Post with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPosts,
  getPostByIdOrSlug,
  createPost,
  updatePost,
  deletePost,
};
```