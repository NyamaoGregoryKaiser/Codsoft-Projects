const { Post, User, Category } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getCache, setCache, deleteCache } = require('../utils/cache');
const _ = require('lodash'); // For deep cloning/object manipulation if needed

// Cache keys for posts, potentially category-specific or overall list
const POSTS_CACHE_KEY_PREFIX = 'posts_list:';
const POST_DETAIL_CACHE_KEY_PREFIX = 'post_detail:';

/**
 * Generates a cache key for a list of posts based on pagination and filters.
 * @param {number} page
 * @param {number} limit
 * @param {Object} filters
 * @returns {string}
 */
const generatePostsListCacheKey = (page, limit, filters) => {
  const filterString = JSON.stringify(filters || {});
  return `${POSTS_CACHE_KEY_PREFIX}page-${page}_limit-${limit}_filters-${filterString}`;
};

/**
 * Retrieves all posts with pagination, filtering, and caching.
 * @param {number} page - Current page number.
 * @param {number} limit - Number of posts per page.
 * @param {Object} filters - Optional filters (e.g., status, categoryId, authorId, search).
 * @returns {Object} - Paginated list of posts and total count.
 */
const getAllPosts = async (page = 1, limit = 10, filters = {}) => {
  const cacheKey = generatePostsListCacheKey(page, limit, filters);
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }
    if (filters.authorId) {
      whereClause.authorId = filters.authorId;
    }
    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { content: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'email'] // Only include necessary author fields
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'] // Only include necessary category fields
        }
      ]
    });

    logger.debug(`Retrieved ${posts.length} posts (total: ${count}) for page ${page}, limit ${limit}.`);

    const result = {
      data: posts,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
      },
    };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`Error fetching all posts: ${error.message}`, { stack: error.stack, page, limit, filters });
    throw error;
  }
};

/**
 * Retrieves a single post by ID or slug with caching.
 * @param {string} identifier - The UUID or slug of the post.
 * @returns {Object} - The post object.
 * @throws {Error} If post is not found.
 */
const getPostByIdOrSlug = async (identifier) => {
  const cacheKey = `${POST_DETAIL_CACHE_KEY_PREFIX}${identifier}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
    const whereClause = isUUID ? { id: identifier } : { slug: identifier };

    const post = await Post.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!post) {
      const error = new Error(`Post with identifier '${identifier}' not found`);
      error.statusCode = 404;
      throw error;
    }

    logger.debug(`Retrieved post with identifier: ${identifier}`);
    setCache(cacheKey, post);
    return post;
  } catch (error) {
    logger.error(`Error fetching post by identifier ${identifier}: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Creates a new post.
 * @param {Object} postData - Data for the new post.
 * @param {string} authorId - The UUID of the author.
 * @returns {Object} - The newly created post object.
 * @throws {Error} If post creation fails.
 */
const createPost = async (postData, authorId) => {
  try {
    // Ensure slug is generated if not provided, or sanitize if provided
    if (!postData.slug && postData.title) {
      postData.slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    } else if (postData.slug) {
      postData.slug = postData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    }

    // Check for unique slug
    if (postData.slug) {
      const existingPost = await Post.findOne({ where: { slug: postData.slug } });
      if (existingPost) {
        const error = new Error(`Post with slug '${postData.slug}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Ensure authorId is set
    postData.authorId = authorId;

    const post = await Post.create(postData);

    logger.info(`Post created with ID: ${post.id} by author ${authorId}`);
    // Invalidate relevant cache keys after creation
    flushCache(); // Simple approach: flush all post list caches. More granular invalidation would be better.
    return post;
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`, { stack: error.stack, postData, authorId });
    throw error;
  }
};

/**
 * Updates an existing post.
 * @param {string} id - The UUID of the post to update.
 * @param {Object} updateData - Data to update the post with.
 * @param {string} currentUserId - The ID of the user performing the update.
 * @param {string} currentUserRole - The role of the user performing the update.
 * @returns {Object} - The updated post object.
 * @throws {Error} If post is not found or update fails due to authorization/validation.
 */
const updatePost = async (id, updateData, currentUserId, currentUserRole) => {
  try {
    const post = await Post.findByPk(id);

    if (!post) {
      const error = new Error(`Post with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Authorization check: only admin can edit any post, editor can edit their own or drafts/pending posts
    // For simplicity, editors can edit their own posts OR any draft/archived post.
    // Admins can edit anything.
    if (currentUserRole !== 'admin' && post.authorId !== currentUserId) {
        // If not admin, and not the author, check if it's a draft/archived post
        if (!['draft', 'archived'].includes(post.status)) {
            const error = new Error('You are not authorized to edit this post.');
            error.statusCode = 403; // Forbidden
            throw error;
        }
        // If it's draft/archived, and they are an editor, they can edit it (e.g. for review)
        if (currentUserRole !== 'editor') {
            const error = new Error('You are not authorized to edit this post.');
            error.statusCode = 403; // Forbidden
            throw error;
        }
    }

    // Handle slug change
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    } else if (updateData.slug) {
      updateData.slug = updateData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    }

    if (updateData.slug && updateData.slug !== post.slug) {
      const existingPostWithSlug = await Post.findOne({ where: { slug: updateData.slug } });
      if (existingPostWithSlug && existingPostWithSlug.id !== post.id) {
        const error = new Error(`Post with slug '${updateData.slug}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    // If status is changed to published and publishedAt is not set, set it.
    if (updateData.status === 'published' && !post.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await post.update(updateData);

    logger.info(`Post updated with ID: ${id} by user ${currentUserId}`);
    // Invalidate relevant cache keys after update
    deleteCache(`${POST_DETAIL_CACHE_KEY_PREFIX}${id}`);
    deleteCache(`${POST_DETAIL_CACHE_KEY_PREFIX}${post.slug}`); // If slug changed, delete old and new slug caches too
    flushCache(); // Invalidate all post list caches
    return post;
  } catch (error) {
    logger.error(`Error updating post with ID ${id}: ${error.message}`, { stack: error.stack, updateData, currentUserId, currentUserRole });
    throw error;
  }
};

/**
 * Deletes a post.
 * @param {string} id - The UUID of the post to delete.
 * @param {string} currentUserId - The ID of the user performing the deletion.
 * @param {string} currentUserRole - The role of the user performing the deletion.
 * @returns {number} - The number of destroyed rows (1 if successful, 0 otherwise).
 * @throws {Error} If post is not found or deletion fails due to authorization.
 */
const deletePost = async (id, currentUserId, currentUserRole) => {
  try {
    const post = await Post.findByPk(id);

    if (!post) {
      const error = new Error(`Post with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Authorization check: only admin can delete any post, editor can delete their own posts.
    if (currentUserRole !== 'admin' && post.authorId !== currentUserId) {
      const error = new Error('You are not authorized to delete this post.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    await post.destroy();
    logger.info(`Post deleted with ID: ${id} by user ${currentUserId}`);
    // Invalidate relevant cache keys after deletion
    deleteCache(`${POST_DETAIL_CACHE_KEY_PREFIX}${id}`);
    deleteCache(`${POST_DETAIL_CACHE_KEY_PREFIX}${post.slug}`);
    flushCache(); // Invalidate all post list caches
    return 1; // Indicate successful deletion
  } catch (error) {
    logger.error(`Error deleting post with ID ${id}: ${error.message}`, { stack: error.stack, currentUserId, currentUserRole });
    throw error;
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