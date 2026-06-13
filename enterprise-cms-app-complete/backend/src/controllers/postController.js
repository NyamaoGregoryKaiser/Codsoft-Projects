const postService = require('../services/postService');
const { ApiError } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * Joi schema for creating a post.
 */
const createPostSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), // Will be generated if not provided
  content: Joi.string().required(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  categoryId: Joi.string().uuid().optional().allow(null),
  featuredImageId: Joi.string().uuid().optional().allow(null),
});

/**
 * Joi schema for updating a post.
 */
const updatePostSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content: Joi.string().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  categoryId: Joi.string().uuid().optional().allow(null),
  featuredImageId: Joi.string().uuid().optional().allow(null),
}).min(1); // At least one field must be provided for update

/**
 * Create a new post.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const createPost = async (req, res, next) => {
  try {
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const post = await postService.createPost(value, req.user.id);
    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all posts.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getAllPosts = async (req, res, next) => {
  try {
    // Determine if drafts should be included based on user role
    const includeDrafts = ['admin', 'editor', 'author'].includes(req.user?.role) || false;
    const posts = await postService.getAllPosts(req.query, includeDrafts);
    res.status(200).json({
      status: 'success',
      data: posts.rows,
      meta: {
        total: posts.count,
        limit: parseInt(req.query.limit || '10', 10),
        offset: parseInt(req.query.offset || '0', 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single post by ID or slug.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getPostById = async (req, res, next) => {
  try {
    // Determine if drafts should be included based on user role
    const includeDrafts = ['admin', 'editor', 'author'].includes(req.user?.role) || false;
    const post = await postService.getPostByIdentifier(req.params.identifier, includeDrafts);
    res.status(200).json({
      status: 'success',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updatePost = async (req, res, next) => {
  try {
    const { error, value } = updatePostSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const updatedPost = await postService.updatePost(req.params.id, value, req.user.id, req.user.role);
    res.status(200).json({
      status: 'success',
      message: 'Post updated successfully',
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};