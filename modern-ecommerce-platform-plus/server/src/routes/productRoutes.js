```javascript
// server/src/routes/productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { validate, productValidation } = require('../utils/validators');

const router = express.Router();

router
  .route('/')
  .post(auth, authorize('ADMIN'), validate(productValidation.createProduct), productController.createProduct)
  .get(productController.getProducts); // Public access to view products

router
  .route('/:productId')
  .get(productController.getProduct) // Public access to view single product
  .put(auth, authorize('ADMIN'), validate(productValidation.updateProduct), productController.updateProduct)
  .delete(auth, authorize('ADMIN'), productController.deleteProduct);

module.exports = router;

```