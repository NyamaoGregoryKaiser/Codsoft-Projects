const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const db = require('../models');

const createCategory = catchAsync(async (req, res) => {
  const category = await db.Category.create(req.body);
  res.status(httpStatus.CREATED).send(category);
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await db.Category.findAll();
  res.send(categories);
});

const getCategory = catchAsync(async (req, res) => {
  const category = await db.Category.findByPk(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  res.send(category);
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await db.Category.findByPk(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  Object.assign(category, req.body);
  await category.save();
  res.send(category);
});

const deleteCategory = catchAsync(async (req, res) => {
  const category = await db.Category.findByPk(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  await category.destroy();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};