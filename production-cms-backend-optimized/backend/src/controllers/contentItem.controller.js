```javascript
const contentItemService = require('../services/contentItem.service');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

/**
 * Get all content items, with optional filtering by contentTypeId.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getAllContentItems = async (req, res, next) => {
  try {
    const { contentTypeId, limit = 10, offset = 0 } = req.query;
    const cacheKey = cache.generateKey('content_items', contentTypeId, limit, offset);
    let contentItems = await cache.get(cacheKey);

    if (contentItems) {
      logger.info(`Serving content items from cache: ${cacheKey}`);
      return res.status(200).json(JSON.parse(contentItems));
    }

    contentItems = await contentItemService.getAllContentItems(contentTypeId, limit, offset);
    await cache.set(cacheKey, JSON.stringify(contentItems), config.cacheDuration); // Cache for 1 hour

    res.status(200).json(contentItems);
  } catch (error) {
    logger.error(`Error fetching all content items: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Get a single content item by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getContentItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = cache.generateKey('content_item', id);
    let contentItem = await cache.get(cacheKey);

    if (contentItem) {
      logger.info(`Serving content item from cache: ${cacheKey}`);
      return res.status(200).json(JSON.parse(contentItem));
    }

    contentItem = await contentItemService.getContentItemById(id);
    if (!contentItem) {
      throw createError(404, 'Content item not found');
    }
    await cache.set(cacheKey, JSON.stringify(contentItem), config.cacheDuration); // Cache for 1 hour

    res.status(200).json(contentItem);
  } catch (error) {
    logger.error(`Error fetching content item by ID ${req.params.id}: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Create a new content item.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.createContentItem = async (req, res, next) => {
  try {
    const { contentTypeId, data, status } = req.body;
    const userId = req.user.id; // Get user from authenticated token
    const contentItem = await contentItemService.createContentItem(contentTypeId, data, userId, status);

    // Invalidate cache for all content items of this type
    await cache.delPattern('content_items:*');
    logger.info(`Cache invalidated for content_items due to new item creation.`);

    res.status(201).json(contentItem);
  } catch (error) {
    logger.error(`Error creating content item: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Update an existing content item.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateContentItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contentTypeId, data, status } = req.body; // contentTypeId might be needed for validation but not necessarily updated
    const userId = req.user.id; // User performing the update

    const updatedContentItem = await contentItemService.updateContentItem(id, data, userId, status);
    if (!updatedContentItem) {
      throw createError(404, 'Content item not found');
    }

    // Invalidate specific cache and all content item lists
    await cache.del(cache.generateKey('content_item', id));
    await cache.delPattern('content_items:*');
    logger.info(`Cache invalidated for content_item:${id} and content_items due to update.`);

    res.status(200).json(updatedContentItem);
  } catch (error) {
    logger.error(`Error updating content item ${req.params.id}: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};

/**
 * Delete a content item.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.deleteContentItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await contentItemService.deleteContentItem(id);
    if (!deleted) {
      throw createError(404, 'Content item not found');
    }

    // Invalidate specific cache and all content item lists
    await cache.del(cache.generateKey('content_item', id));
    await cache.delPattern('content_items:*');
    logger.info(`Cache invalidated for content_item:${id} and content_items due to deletion.`);

    res.status(204).send(); // No content
  } catch (error) {
    logger.error(`Error deleting content item ${req.params.id}: ${error.message}`, { error });
    next(createError(error.statusCode || 500, error.message));
  }
};
```