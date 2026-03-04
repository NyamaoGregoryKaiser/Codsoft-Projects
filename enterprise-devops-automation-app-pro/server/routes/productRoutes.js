const express = require('express');
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (anyone can view products)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (requires authentication)
router.use(protect);

router.post('/', productController.createProduct); // Any logged-in user can create products

// Only owner or admin can update/delete
router.route('/:id')
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;