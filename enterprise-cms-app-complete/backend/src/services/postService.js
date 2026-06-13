const { Post, User, Category, Media } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { client: redisClient } = require('./cacheService');
const logger = require('../utils/logger');

const POSTS_CACHE_KEY = 'all_posts';

/**
 * Create a new post.
 * @param {object} postData - Data for the new post.
 * @param {string} authorId - ID of the author.
 * @returns {object} - The created post.
 * @throws {ApiError} 400 if slug already exists.
 */
const createPost = async (postData, authorId) => {
  postData.authorId = authorId;

  // Ensure slug is unique
  if (postData.slug) {
    const existingPost = await Post.findOne({ where: { slug: postData.slug } });
    if (existingPost) {
      throw new ApiError(400, `Post with slug '${postData.slug}' already exists.`);
    }
  }

  const post = await Post.create(postData);
  await redisClient.del(POSTS_CACHE_KEY); // Invalidate cache

  logger.info(`Post created: ${post.title} by ${authorId}`);
  return post;
};

/**
 * Get all posts with optional filtering and pagination.
 * @param {object} queryOptions - Options for filtering (status, categoryId, authorId), pagination (limit, offset), and sorting.
 * @param {boolean} includeDrafts - Whether to include draft posts (for authorized users).
 * @returns {object} - Paginated list of posts.
 */
const getAllPosts = async (queryOptions = {}, includeDrafts = false) => {
  const { limit = 10, offset = 0, status, categoryId, authorId, search, sortBy = 'publishedAt', sortOrder = 'DESC' } = queryOptions;

  const where = {};
  if (!includeDrafts) {
    where.status = 'published';
  } else if (status) {
    where.status = status;
  }
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (search) {
    where[Post.sequelize.Op.or] = [
      { title: { [Post.sequelize.Op.iLike]: `%${search}%` } },
      { content: { [Post.sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  const cacheKey = `${POSTS_CACHE_KEY}:${JSON.stringify({ limit, offset, status, categoryId, authorId, search, sortBy, sortOrder, includeDrafts })}`;
  const cachedPosts = await redisClient.get(cacheKey);

  if (cachedPosts) {
    logger.debug(`Cache hit for posts: ${cacheKey}`);
    return JSON.parse(cachedPosts);
  }

  const posts = await Post.findAndCountAll({
    where,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: Media, as: 'featuredImage', attributes: ['id', 'filename', 'filepath'] },
    ],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [[sortBy, sortOrder]],
  });

  await redisClient.set(cacheKey, JSON.stringify(posts), { EX: 60 * 5 }); // Cache for 5 minutes
  logger.info(`Fetched ${posts.rows.length} posts. Cache miss, set for ${cacheKey}`);
  return posts;
};

/**
 * Get a single post by slug or ID.
 * @param {string} identifier - The slug or ID of the post.
 * @param {boolean} includeDrafts - Whether to allow fetching draft posts.
 * @returns {object} - The post object.
 * @throws {ApiError} 404 if post not found or unauthorized for drafts.
 */
const getPostByIdentifier = async (identifier, includeDrafts = false) => {
  const whereClause = identifier.length === 36 ? { id: identifier } : { slug: identifier };

  const cacheKey = `post:${identifier}:${includeDrafts}`;
  const cachedPost = await redisClient.get(cacheKey);

  if (cachedPost) {
    logger.debug(`Cache hit for post: ${cacheKey}`);
    return JSON.parse(cachedPost);
  }

  const post = await Post.findOne({
    where: whereClause,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: Media, as: 'featuredImage', attributes: ['id', 'filename', 'filepath'] },
    ],
  });

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (post.status === 'draft' && !includeDrafts) {
    throw new ApiError(403, 'Forbidden: You do not have permission to view this draft post.');
  }

  await redisClient.set(cacheKey, JSON.stringify(post), { EX: 60 * 10 }); // Cache for 10 minutes
  logger.info(`Fetched post: ${identifier}. Cache miss, set for ${cacheKey}`);
  return post;
};

/**
 * Update an existing post.
 * @param {string} postId - The ID of the post to update.
 * @param {object} updateData - Data to update the post.
 * @param {string} userId - ID of the user making the update.
 * @param {string} userRole - Role of the user making the update.
 * @returns {object} - The updated post.
 * @throws {ApiError} 403 if unauthorized.
 * @throws {ApiError} 404 if post not found.
 * @throws {ApiError} 400 if slug already exists.
 */
const updatePost = async (postId, updateData, userId, userRole) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  // Authorization: Only admin/editor or the author can update
  if (userRole !== 'admin' && userRole !== 'editor' && post.authorId !== userId) {
    throw new ApiError(403, 'Forbidden: You do not have permission to update this post.');
  }

  // If slug is being updated, check for uniqueness
  if (updateData.slug && updateData.slug !== post.slug) {
    const existingPostWithSlug = await Post.findOne({ where: { slug: updateData.slug } });
    if (existingPostWithSlug && existingPostWithSlug.id !== postId) {
      throw new ApiError(400, `Post with slug '${updateData.slug}' already exists.`);
    }
  }

  // If status is changed to 'published' and publishedAt is not set, set it now
  if (updateData.status === 'published' && !post.publishedAt) {
    updateData.publishedAt = new Date();
  }

  await post.update(updateData);
  await redisClient.del(POSTS_CACHE_KEY); // Invalidate all posts cache
  await redisClient.del(`post:${post.id}:true`); // Invalidate specific post cache (for drafts)
  await redisClient.del(`post:${post.id}:false`); // Invalidate specific post cache (for published)
  await redisClient.del(`post:${post.slug}:true`); // Invalidate specific post cache (for drafts)
  await redisClient.del(`post:${post.slug}:false`); // Invalidate specific post cache (for published)


  logger.info(`Post updated: ${post.title} by ${userId}`);
  return post;
};

/**
 * Delete a post.
 * @param {string} postId - The ID of the post to delete.
 * @param {string} userId - ID of the user making the deletion.
 * @param {string} userRole - Role of the user making the deletion.
 * @throws {ApiError} 403 if unauthorized.
 * @throws {ApiError} 404 if post not found.
 */
const deletePost = async (postId, userId, userRole) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  // Authorization: Only admin/editor or the author can delete
  if (userRole !== 'admin' && userRole !== 'editor' && post.authorId !== userId) {
    throw new ApiError(403, 'Forbidden: You do not have permission to delete this post.');
  }

  await post.destroy();
  await redisClient.del(POSTS_CACHE_KEY); // Invalidate all posts cache
  await redisClient.del(`post:${post.id}:true`);
  await redisClient.del(`post:${post.id}:false`);
  await redisClient.del(`post:${post.slug}:true`);
  await redisClient.del(`post:${post.slug}:false`);

  logger.info(`Post deleted: ${post.title} by ${userId}`);
  return { message: 'Post deleted successfully.' };
};

module.exports = {
  createPost,
  getAllPosts,
  getPostByIdentifier,
  updatePost,
  deletePost,
};