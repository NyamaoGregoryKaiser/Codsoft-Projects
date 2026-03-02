const express = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const productController = require('../../controllers/product.controller');

const router = express.Router();

router
  .route('/')
  .post(authMiddleware, productController.createProduct)
  .get(authMiddleware, productController.getProducts);

router
  .route('/:id')
  .get(authMiddleware, productController.getProduct)
  .put(authMiddleware, productController.updateProduct)
  .delete(authMiddleware, productController.deleteProduct);

module.exports = router;
```

```