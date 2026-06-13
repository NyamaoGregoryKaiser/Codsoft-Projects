const categoryService = require('../services/categoryService');
const { ApiError } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * Joi schema for creating a category.
 */
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), // Will be generated if not provided
  description: Joi.string().allow('').optional(),
});

/**
 * Joi schema for updating a category.
 */
const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: Joi.string().allow('').optional(),
}).min(1); // At least one field must be provided for update

/**
 * Create a new category.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const createCategory = async (req, res, next) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const category = await categoryService.createCategory(value);
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getAllCategories = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const categories = await categoryService.getAllCategories({ limit, offset });
    res.status(200).json({
      status: 'success',
      data: categories.rows,
      meta: {
        total: categories.count,
        limit: parseInt(limit, 10) || 10,
        offset: parseInt(offset, 10) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a category by ID or slug.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryByIdentifier(req.params.identifier);
    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updateCategory = async (req, res, next) => {
  try {
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const updatedCategory = await categoryService.updateCategory(req.params.id, value);
    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};