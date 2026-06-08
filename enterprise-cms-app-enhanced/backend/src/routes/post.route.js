const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const postValidation = require('../utils/validationSchemas');
const postController = require('../controllers/post.controller');
const { cacheMiddleware, clearCache } = require('../middlewares/cache.middleware');

const router = express.Router();

router
  .route('/')
  .post(auth('admin', 'editor'), validate(postValidation.createPost), clearCache, postController.createPost)
  .get(cacheMiddleware, postController.getPosts); // Publicly accessible or cached

router
  .route('/:postId')
  .get(cacheMiddleware, postController.getPost) // Publicly accessible or cached
  .patch(auth('admin', 'editor'), validate(postValidation.updatePost), clearCache, postController.updatePost)
  .delete(auth('admin', 'editor'), clearCache, postController.deletePost);

module.exports = router;