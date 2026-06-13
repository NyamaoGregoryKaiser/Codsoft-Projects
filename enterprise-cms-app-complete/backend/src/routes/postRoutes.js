const express = require('express');
const postController = require('../controllers/postController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible read operations
router.get('/', postController.getAllPosts); // Public can view published posts
router.get('/:identifier', postController.getPostById); // Public can view published posts by ID or slug

// Authenticated users (Author, Editor, Admin) can create, update, delete
router.post('/', authenticate, authorize(['admin', 'editor', 'author']), postController.createPost);
router.put('/:id', authenticate, authorize(['admin', 'editor', 'author']), postController.updatePost); // Author can update their own, Editor/Admin can update any
router.delete('/:id', authenticate, authorize(['admin', 'editor', 'author']), postController.deletePost); // Author can delete their own, Editor/Admin can delete any

module.exports = router;