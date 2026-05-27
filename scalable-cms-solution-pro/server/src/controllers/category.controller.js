```javascript
const httpStatus = require('http-status');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(httpStatus.OK).json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category;
    if (id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      category = await Category.findByPk(id);
    } else {
      category = await Category.findOne({ where: { slug: id } });
    }

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    res.status(httpStatus.OK).json(category);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    logger.info(`Category created by ${req.user.id}: ${category.name}`);
    res.status(httpStatus.CREATED).json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Category name or slug already exists'));
    }
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    await category.update(req.body);
    logger.info(`Category ${req.params.id} updated by ${req.user.id}`);
    res.status(httpStatus.OK).json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Category name or slug already exists'));
    }
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    await category.destroy();
    logger.info(`Category ${req.params.id} deleted by ${req.user.id}`);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
```