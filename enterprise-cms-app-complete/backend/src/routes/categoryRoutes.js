const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible read operations
router.get('/', categoryController.getAllCategories);
router.get('/:identifier', categoryController.getCategoryById);

// Only Admins and Editors can manage categories
router.post('/', authenticate, authorize(['admin', 'editor']), categoryController.createCategory);
router.put('/:id', authenticate, authorize(['admin', 'editor']), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(['admin', 'editor']), categoryController.deleteCategory);

module.exports = router;