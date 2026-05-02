```javascript
const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cache } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Public routes (can be cached)
router.get('/', cache('products'), getProducts);
router.get('/:id', cache('products'), getProductById);

// Protected routes
router.post('/', protect, authorize('admin', 'user'), createProduct);
router.put('/:id', protect, authorize('admin', 'user'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'user'), deleteProduct);

module.exports = router;
```