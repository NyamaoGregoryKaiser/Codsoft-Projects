const { Category } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { client: redisClient } = require('./cacheService');
const logger = require('../utils/logger');

const CATEGORIES_CACHE_KEY = 'all_categories';

/**
 * Create a new category.
 * @param {object} categoryData - Data for the new category (name, description, slug).
 * @returns {object} - The created category.
 * @throws {ApiError} 400 if name or slug already exists.
 */
const createCategory = async (categoryData) => {
  // Check for existing name or slug
  const existingCategory = await Category.findOne({
    where: {
      [Category.sequelize.Op.or]: [
        { name: categoryData.name },
        { slug: categoryData.slug },
      ],
    },
  });

  if (existingCategory) {
    if (existingCategory.name === categoryData.name) {
      throw new ApiError(400, `Category with name '${categoryData.name}' already exists.`);
    }
    if (existingCategory.slug === categoryData.slug) {
      throw new ApiError(440, `Category with slug '${categoryData.slug}' already exists.`);
    }
  }

  const category = await Category.create(categoryData);
  await redisClient.del(CATEGORIES_CACHE_KEY); // Invalidate cache

  logger.info(`Category created: ${category.name}`);
  return category;
};

/**
 * Get all categories.
 * @param {object} queryOptions - Options for pagination, filtering.
 * @returns {object} - Paginated list of categories.
 */
const getAllCategories = async (queryOptions = {}) => {
  const { limit = 10, offset = 0 } = queryOptions;

  const cacheKey = `${CATEGORIES_CACHE_KEY}:${JSON.stringify({ limit, offset })}`;
  const cachedCategories = await redisClient.get(cacheKey);

  if (cachedCategories) {
    logger.debug(`Cache hit for categories: ${cacheKey}`);
    return JSON.parse(cachedCategories);
  }

  const categories = await Category.findAndCountAll({
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['name', 'ASC']],
  });

  await redisClient.set(cacheKey, JSON.stringify(categories), { EX: 60 * 5 }); // Cache for 5 minutes
  logger.info(`Fetched ${categories.rows.length} categories. Cache miss, set for ${cacheKey}`);
  return categories;
};

/**
 * Get a single category by ID or slug.
 * @param {string} identifier - The ID or slug of the category.
 * @returns {object} - The category object.
 * @throws {ApiError} 404 if category not found.
 */
const getCategoryByIdentifier = async (identifier) => {
  const whereClause = identifier.length === 36 ? { id: identifier } : { slug: identifier };

  const cacheKey = `category:${identifier}`;
  const cachedCategory = await redisClient.get(cacheKey);

  if (cachedCategory) {
    logger.debug(`Cache hit for category: ${cacheKey}`);
    return JSON.parse(cachedCategory);
  }

  const category = await Category.findOne({ where: whereClause });

  if (!category) {
    throw new ApiError(404, 'Category not found.');
  }

  await redisClient.set(cacheKey, JSON.stringify(category), { EX: 60 * 10 }); // Cache for 10 minutes
  logger.info(`Fetched category: ${identifier}. Cache miss, set for ${cacheKey}`);
  return category;
};

/**
 * Update an existing category.
 * @param {string} categoryId - The ID of the category to update.
 * @param {object} updateData - Data to update the category.
 * @returns {object} - The updated category.
 * @throws {ApiError} 404 if category not found.
 * @throws {ApiError} 400 if name or slug already exists for another category.
 */
const updateCategory = async (categoryId, updateData) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new ApiError(404, 'Category not found.');
  }

  // Check for duplicate name or slug if they are being updated
  if (updateData.name && updateData.name !== category.name) {
    const existingNameCategory = await Category.findOne({ where: { name: updateData.name } });
    if (existingNameCategory && existingNameCategory.id !== categoryId) {
      throw new ApiError(400, `Category with name '${updateData.name}' already exists.`);
    }
  }
  if (updateData.slug && updateData.slug !== category.slug) {
    const existingSlugCategory = await Category.findOne({ where: { slug: updateData.slug } });
    if (existingSlugCategory && existingSlugCategory.id !== categoryId) {
      throw new ApiError(400, `Category with slug '${updateData.slug}' already exists.`);
    }
  }

  await category.update(updateData);
  await redisClient.del(CATEGORIES_CACHE_KEY); // Invalidate all categories cache
  await redisClient.del(`category:${category.id}`);
  await redisClient.del(`category:${category.slug}`);

  logger.info(`Category updated: ${category.name}`);
  return category;
};

/**
 * Delete a category.
 * @param {string} categoryId - The ID of the category to delete.
 * @returns {object} - Success message.
 * @throws {ApiError} 404 if category not found.
 */
const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new ApiError(404, 'Category not found.');
  }

  // TODO: Consider handling associated posts (e.g., set categoryId to null, or cascade delete).
  // For now, it's configured to SET NULL in migration.

  await category.destroy();
  await redisClient.del(CATEGORIES_CACHE_KEY); // Invalidate all categories cache
  await redisClient.del(`category:${category.id}`);
  await redisClient.del(`category:${category.slug}`);

  logger.info(`Category deleted: ${category.name}`);
  return { message: 'Category deleted successfully.' };
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryByIdentifier,
  updateCategory,
  deleteCategory,
};