```javascript
const httpStatus = require('http-status');
const { Post, User, Category } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Create a post
 * @param {Object} postBody
 * @returns {Promise<Post>}
 */
const createPost = async (postBody) => {
  const category = await Category.findByPk(postBody.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category not found');
  }
  // Ensure the slug is unique or generate a new one
  if (!postBody.slug) {
    postBody.slug = postBody.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
  }
  const existingPost = await Post.findOne({ where: { slug: postBody.slug } });
  if (existingPost) {
    postBody.slug += `-${Date.now()}`; // Append timestamp for uniqueness
  }

  const post = await Post.create(postBody);
  // Reload with associations for the response
  return Post.findByPk(post.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'email'] }, { model: Category, as: 'category' }],
  });
};

/**
 * Query for posts
 * @param {Object} filter - Filter options (category, search, status)
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const queryPosts = async (filter, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const where = {};
  const include = [
    { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
    { model: Category, as: 'category' },
  ];

  if (filter.categorySlug) {
    include[1].where = { slug: filter.categorySlug };
  }

  if (filter.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${filter.search}%` } },
      { content: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }

  if (filter.status) {
    where.status = filter.status;
  }

  const { count, rows: posts } = await Post.findAndCountAll({
    where,
    include,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
    distinct: true, // Crucial for correct count with includes
  });

  return {
    posts,
    totalPosts: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page, 10),
  };
};

/**
 * Get post by id
 * @param {string} id
 * @returns {Promise<Post>}
 */
const getPostById = async (id) => {
  return Post.findByPk(id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'email'] }, { model: Category, as: 'category' }],
  });
};

/**
 * Update post by id
 * @param {string} postId
 * @param {Object} updateBody
 * @returns {Promise<Post>}
 */
const updatePostById = async (postId, updateBody) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  if (updateBody.categoryId) {
    const category = await Category.findByPk(updateBody.categoryId);
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category not found');
    }
  }

  // If title is updated, re-generate slug if no custom slug is provided
  if (updateBody.title && !updateBody.slug) {
    updateBody.slug = updateBody.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
  }

  // Check for slug uniqueness if a new slug is being set
  if (updateBody.slug && updateBody.slug !== post.slug) {
    const existingPostWithSlug = await Post.findOne({ where: { slug: updateBody.slug } });
    if (existingPostWithSlug && existingPostWithSlug.id !== post.id) {
      updateBody.slug += `-${Date.now()}`; // Append timestamp for uniqueness
      logger.warn(`Generated unique slug for post ${postId} due to conflict: ${updateBody.slug}`);
    }
  }

  Object.assign(post, updateBody);
  await post.save();
  // Reload with associations for the response
  return Post.findByPk(post.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'email'] }, { model: Category, as: 'category' }],
  });
};

/**
 * Delete post by id
 * @param {string} postId
 * @returns {Promise<Post>}
 */
const deletePostById = async (postId) => {
  const post = await getPostById(postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  await post.destroy();
  return post;
};

module.exports = {
  createPost,
  queryPosts,
  getPostById,
  updatePostById,
  deletePostById,
};
```