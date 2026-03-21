const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const productValidation = require('../utils/validation/product.validation');
const { cache, clearCache } = require('../middleware/cache.middleware');

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize('admin'),
    validate(productValidation.createProduct),
    clearCache('products'), // Clear products cache on creation
    productController.createProduct
  )
  .get(
    cache('products', 60), // Cache products list for 60 seconds
    validate(productValidation.getProducts),
    productController.getProducts
  );

router
  .route('/:productId')
  .get(
    validate(productValidation.getProduct),
    productController.getProduct
  )
  .put(
    authenticate,
    authorize('admin'),
    validate(productValidation.updateProduct),
    clearCache('products'), // Clear products cache on update
    productController.updateProduct
  )
  .delete(
    authenticate,
    authorize('admin'),
    validate(productValidation.deleteProduct),
    clearCache('products'), // Clear products cache on deletion
    productController.deleteProduct
  );

module.exports = router;