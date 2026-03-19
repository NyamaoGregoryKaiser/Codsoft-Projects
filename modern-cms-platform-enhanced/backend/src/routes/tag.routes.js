```javascript
const express = require('express');
const postService = require('../services/post.service'); // Using postService for tag CRUD
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { cacheMiddleware, deleteCache } = require('../utils/cache');
const logger = require('../utils/logger');

const router = express.Router();

const ALL_TAGS_CACHE_KEY = '/api/tags';

// Public route to get all tags (cached)
router.get('/', cacheMiddleware(3600), async (req, res, next) => {
    try {
        const tags = await postService.findAllTags();
        res.status(200).json(tags);
    } catch (error) {
        logger.error('Error fetching all tags:', error.message);
        next(error);
    }
});

// Authenticated routes for tag management (Admin only)
router.use(authenticate);
router.use(authorize(['admin']));

// POST /api/tags - Create a new tag
router.post('/', async (req, res, next) => {
    try {
        const tag = await postService.createTag(req.body);
        deleteCache(ALL_TAGS_CACHE_KEY); // Invalidate cache
        res.status(201).json({ message: 'Tag created successfully.', tag });
    } catch (error) {
        logger.error('Error creating tag:', error.message);
        next(error);
    }
});

// PUT /api/tags/:id - Update a tag
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedTag = await postService.updateTag(id, req.body);
        if (!updatedTag) {
            return res.status(404).json({ message: 'Tag not found.' });
        }
        deleteCache(ALL_TAGS_CACHE_KEY); // Invalidate cache
        res.status(200).json({ message: 'Tag updated successfully.', tag: updatedTag });
    } catch (error) {
        logger.error(`Error updating tag ${req.params.id}:`, error.message);
        next(error);
    }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await postService.deleteTag(id);
        if (!success) {
            return res.status(404).json({ message: 'Tag not found.' });
        }
        deleteCache(ALL_TAGS_CACHE_KEY); // Invalidate cache
        res.status(200).json({ message: 'Tag deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting tag ${req.params.id}:`, error.message);
        next(error);
    }
});

module.exports = router;
```