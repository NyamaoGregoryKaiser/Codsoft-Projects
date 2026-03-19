```javascript
const express = require('express');
const postController = require('../controllers/post.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { cacheMiddleware } = require('../utils/cache');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');

const router = express.Router();

// Multer setup for file uploads (e.g., featured images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../', config.uploadDir));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Public routes (no authentication required) - heavily cached
router.get('/published', cacheMiddleware(3600), postController.getPublishedPosts);
router.get('/:identifier', cacheMiddleware(3600), postController.getPost); // Get by ID or Slug

// Authenticated routes
router.use(authenticate);

// Admin/Author routes for full content management
// GET /api/posts - Get all posts (includes drafts/archived for authorized users)
router.get('/', authorize(['admin', 'author']), cacheMiddleware(600), postController.getAllPosts); // Less aggressive caching for authenticated view

// POST /api/posts - Create a new post
router.post('/', authorize(['admin', 'author']), postController.createPost);

// PUT /api/posts/:id - Update a post
router.put('/:id', authorize(['admin', 'author']), postController.updatePost);

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', authorize(['admin', 'author']), postController.deletePost);

// POST /api/posts/:id/image - Upload featured image for a post
router.post('/:id/image', authorize(['admin', 'author']), upload.single('featuredImage'), postController.uploadFeaturedImage);

module.exports = router;
```