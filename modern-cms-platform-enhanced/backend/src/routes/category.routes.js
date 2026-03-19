```javascript
const express = require('express');
const postService = require('../services/post.service'); // Using postService for category CRUD
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { cacheMiddleware, deleteCache } = require('../utils/cache');
const logger = require('../utils/logger');

const router = express.Router();

const ALL_CATEGORIES_CACHE_KEY = '/api/categories';

// Public route to get all categories (cached)
router.get('/', cacheMiddleware(3600), async (req, res, next) => {
    try {
        const categories = await postService.findAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        logger.error('Error fetching all categories:', error.message);
        next(error);
    }
});

// Authenticated routes for category management (Admin only)
router.use(authenticate);
router.use(authorize(['admin']));

// POST /api/categories - Create a new category
router.post('/', async (req, res, next) => {
    try {
        const category = await postService.createCategory(req.body);
        deleteCache(ALL_CATEGORIES_CACHE_KEY); // Invalidate cache
        res.status(201).json({ message: 'Category created successfully.', category });
    } catch (error) {
        logger.error('Error creating category:', error.message);
        next(error);
    }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedCategory = await postService.updateCategory(id, req.body);
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        deleteCache(ALL_CATEGORIES_CACHE_KEY); // Invalidate cache
        res.status(200).json({ message: 'Category updated successfully.', category: updatedCategory });
    } catch (error) {
        logger.error(`Error updating category ${req.params.id}:`, error.message);
        next(error);
    }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await postService.deleteCategory(id);
        if (!success) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        deleteCache(ALL_CATEGORIES_CACHE_KEY); // Invalidate cache
        res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting category ${req.params.id}:`, error.message);
        next(error);
    }
});

module.exports = router;
```