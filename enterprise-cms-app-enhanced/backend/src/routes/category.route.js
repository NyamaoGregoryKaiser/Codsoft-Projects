const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const categoryValidation = require('../utils/validationSchemas');
const categoryController = require('../controllers/category.controller');
const { cacheMiddleware, clearCache } = require('../middlewares/cache.middleware');

const router = express.Router();

router
  .route('/')
  .post(auth('admin', 'editor'), validate(categoryValidation.createCategory), clearCache, categoryController.createCategory)
  .get(cacheMiddleware, categoryController.getCategories); // Publicly accessible or cached

router
  .route('/:categoryId')
  .get(cacheMiddleware, categoryController.getCategory) // Publicly accessible or cached
  .patch(auth('admin', 'editor'), validate(categoryValidation.updateCategory), clearCache, categoryController.updateCategory)
  .delete(auth('admin'), clearCache, categoryController.deleteCategory); // Only admin can delete categories

module.exports = router;